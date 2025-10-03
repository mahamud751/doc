"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function seedLabData() {
    return __awaiter(this, void 0, void 0, function () {
        var labTests, _i, labTests_1, test, basicPackage, createdTests, _a, createdTests_1, test, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 11, 12, 14]);
                    labTests = [
                        {
                            name: "Complete Blood Count (CBC)",
                            code: "CBC001",
                            description: "Comprehensive blood analysis including RBC, WBC, platelets, and hemoglobin",
                            category: "Blood Test",
                            price: 800,
                            sample_type: "Blood",
                            preparation_required: false,
                            reporting_time: "24 hours",
                            normal_range: "WBC: 4,000-11,000/μL, RBC: 4.5-5.5 million/μL",
                        },
                        {
                            name: "Lipid Profile",
                            code: "LIP001",
                            description: "Measures cholesterol and triglyceride levels",
                            category: "Blood Test",
                            price: 1200,
                            sample_type: "Blood",
                            preparation_required: true,
                            preparation_instructions: "Fasting for 12 hours required",
                            reporting_time: "24 hours",
                            normal_range: "Total Cholesterol: <200 mg/dL, HDL: >40 mg/dL, LDL: <100 mg/dL",
                        },
                        {
                            name: "Thyroid Function Test (TFT)",
                            code: "TFT001",
                            description: "Evaluates thyroid gland function",
                            category: "Hormone Test",
                            price: 1500,
                            sample_type: "Blood",
                            preparation_required: false,
                            reporting_time: "48 hours",
                            normal_range: "TSH: 0.4-4.0 mIU/L, T3: 80-200 ng/dL, T4: 5.0-12.0 μg/dL",
                        },
                        {
                            name: "Liver Function Test (LFT)",
                            code: "LFT001",
                            description: "Assesses liver health and function",
                            category: "Blood Test",
                            price: 1000,
                            sample_type: "Blood",
                            preparation_required: false,
                            reporting_time: "24 hours",
                            normal_range: "ALT: 7-56 U/L, AST: 10-40 U/L, Bilirubin: 0.3-1.2 mg/dL",
                        },
                    ];
                    console.log("Creating lab tests...");
                    _i = 0, labTests_1 = labTests;
                    _b.label = 1;
                case 1:
                    if (!(_i < labTests_1.length)) return [3 /*break*/, 4];
                    test = labTests_1[_i];
                    return [4 /*yield*/, prisma.labTest.create({
                            data: test,
                        })];
                case 2:
                    _b.sent();
                    console.log("Created lab test: ".concat(test.name));
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    // Create sample lab packages
                    console.log("Creating lab packages...");
                    return [4 /*yield*/, prisma.labPackage.create({
                            data: {
                                name: "Basic Health Checkup",
                                description: "Comprehensive health assessment including blood tests and physical examination",
                                category: "General Health",
                                price: 2500,
                                preparation_required: true,
                                preparation_instructions: "Fasting for 12 hours required",
                                reporting_time: "48 hours",
                                is_home_collection: true,
                                is_active: true,
                            },
                        })];
                case 5:
                    basicPackage = _b.sent();
                    console.log("Created lab package: ".concat(basicPackage.name));
                    return [4 /*yield*/, prisma.labTest.findMany({
                            where: {
                                code: {
                                    in: ["CBC001", "LIP001", "LFT001"],
                                },
                            },
                        })];
                case 6:
                    createdTests = _b.sent();
                    // Link tests to the package
                    console.log("Linking tests to packages...");
                    _a = 0, createdTests_1 = createdTests;
                    _b.label = 7;
                case 7:
                    if (!(_a < createdTests_1.length)) return [3 /*break*/, 10];
                    test = createdTests_1[_a];
                    return [4 /*yield*/, prisma.labPackageTest.create({
                            data: {
                                package: {
                                    connect: { id: basicPackage.id },
                                },
                                test: {
                                    connect: { id: test.id },
                                },
                            },
                        })];
                case 8:
                    _b.sent();
                    console.log("Linked test ".concat(test.name, " to package ").concat(basicPackage.name));
                    _b.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("✅ Seeding completed successfully!");
                    return [3 /*break*/, 14];
                case 11:
                    error_1 = _b.sent();
                    console.error("❌ Error seeding data:", error_1);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, prisma.$disconnect()];
                case 13:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
seedLabData();
