import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth-utils";

// Types for stock management
interface StockTransaction {
  medicine_id: string;
  transaction_type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "EXPIRY";
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  batch_number?: string;
  expiry_date?: string;
  supplier?: string;
  notes?: string;
}

interface BulkStockUpdate {
  medicine_id: string;
  new_stock_quantity: number;
  notes?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN", "PHARMACY"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Pharmacy access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    if (type === "summary") {
      // Get stock summary for all medicines
      const stockSummary = await prisma.medicine.findMany({
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          generic_name: true,
          category: true,
          unit_price: true,
          stock_quantity: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { stock_quantity: "asc" }, // Show low stock first
      });

      // Calculate stock values and flags
      const enhancedSummary = stockSummary.map((medicine) => {
        const stockValue =
          Number(medicine.unit_price) * medicine.stock_quantity;
        const isLowStock = medicine.stock_quantity < 50;
        const isCriticalStock = medicine.stock_quantity < 20;

        return {
          ...medicine,
          stock_value: stockValue,
          is_low_stock: isLowStock,
          is_critical_stock: isCriticalStock,
          stock_status: isCriticalStock
            ? "critical"
            : isLowStock
            ? "low"
            : "normal",
        };
      });

      return NextResponse.json({
        success: true,
        medicines: enhancedSummary,
        summary: {
          total_medicines: stockSummary.length,
          low_stock_count: enhancedSummary.filter((m) => m.is_low_stock).length,
          critical_stock_count: enhancedSummary.filter(
            (m) => m.is_critical_stock
          ).length,
          total_stock_value: enhancedSummary.reduce(
            (sum, m) => sum + m.stock_value,
            0
          ),
        },
      });
    }

    // For individual medicine stock transactions (we'll implement this when we create the transactions table)
    // For now, return empty array as we don't have stock transactions table yet
    return NextResponse.json({
      success: true,
      transactions: [],
      message:
        "Stock transactions feature will be implemented with dedicated stock_transactions table",
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN", "PHARMACY"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Pharmacy access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      medicine_id,
      transaction_type,
      quantity,
      unit_price,
      batch_number,
      expiry_date,
      supplier,
      notes,
    }: StockTransaction = body;

    if (!medicine_id || !transaction_type || !quantity) {
      return NextResponse.json(
        { error: "Medicine ID, transaction type, and quantity are required" },
        { status: 400 }
      );
    }

    // Get current medicine stock
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicine_id },
      select: {
        id: true,
        name: true,
        stock_quantity: true,
        unit_price: true,
      },
    });

    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    // Calculate new stock quantity based on transaction type
    let newStockQuantity = medicine.stock_quantity;

    switch (transaction_type) {
      case "PURCHASE":
        newStockQuantity += quantity;
        break;
      case "SALE":
        if (medicine.stock_quantity < quantity) {
          return NextResponse.json(
            { error: "Insufficient stock for sale" },
            { status: 400 }
          );
        }
        newStockQuantity -= quantity;
        break;
      case "ADJUSTMENT":
        // Quantity can be positive or negative for adjustments
        newStockQuantity += quantity;
        if (newStockQuantity < 0) {
          return NextResponse.json(
            { error: "Stock adjustment would result in negative stock" },
            { status: 400 }
          );
        }
        break;
      case "EXPIRY":
        if (medicine.stock_quantity < quantity) {
          return NextResponse.json(
            { error: "Cannot remove more stock than available for expiry" },
            { status: 400 }
          );
        }
        newStockQuantity -= quantity;
        break;
    }

    // Update medicine stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update medicine stock
      const updatedMedicine = await tx.medicine.update({
        where: { id: medicine_id },
        data: {
          stock_quantity: newStockQuantity,
          // Update unit price if provided (for purchases)
          ...(unit_price &&
            transaction_type === "PURCHASE" && { unit_price: unit_price }),
        },
      });

      // Log the transaction in audit log
      await tx.auditLog.create({
        data: {
          user_id: authResult.user!.id,
          action: "UPDATE",
          resource: "Medicine Stock",
          resource_id: medicine_id,
          details: {
            transaction_type,
            medicine_name: medicine.name,
            old_stock: medicine.stock_quantity,
            new_stock: newStockQuantity,
            quantity_changed: quantity,
            unit_price,
            batch_number,
            expiry_date,
            supplier,
            notes,
          },
        },
      });

      return updatedMedicine;
    });

    return NextResponse.json({
      success: true,
      message: `Stock ${transaction_type.toLowerCase()} recorded successfully`,
      medicine: result,
      transaction: {
        type: transaction_type,
        quantity,
        old_stock: medicine.stock_quantity,
        new_stock: newStockQuantity,
      },
    });
  } catch (error) {
    console.error("Error processing stock transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Bulk stock update endpoint
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN"].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { updates } = body; // Array of { medicine_id, new_stock_quantity, notes }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(async (tx) => {
      const updatePromises = updates.map(async (update: BulkStockUpdate) => {
        const { medicine_id, new_stock_quantity, notes } = update;

        if (!medicine_id || new_stock_quantity < 0) {
          throw new Error(`Invalid update data for medicine ${medicine_id}`);
        }

        // Get current stock
        const currentMedicine = await tx.medicine.findUnique({
          where: { id: medicine_id },
          select: { stock_quantity: true, name: true },
        });

        if (!currentMedicine) {
          throw new Error(`Medicine ${medicine_id} not found`);
        }

        // Update stock
        const updatedMedicine = await tx.medicine.update({
          where: { id: medicine_id },
          data: { stock_quantity: new_stock_quantity },
        });

        // Log the bulk update
        await tx.auditLog.create({
          data: {
            user_id: authResult.user!.id,
            action: "BULK_UPDATE",
            resource: "Medicine Stock",
            resource_id: medicine_id,
            details: {
              medicine_name: currentMedicine.name,
              old_stock: currentMedicine.stock_quantity,
              new_stock: new_stock_quantity,
              notes,
              bulk_operation: true,
            },
          },
        });

        return updatedMedicine;
      });

      return Promise.all(updatePromises);
    });

    return NextResponse.json({
      success: true,
      message: `Bulk stock update completed for ${results.length} medicines`,
      updated_count: results.length,
    });
  } catch (error) {
    console.error("Error in bulk stock update:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
