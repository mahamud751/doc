export default function TestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-primary mb-4">
        Tailwind CSS Test
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        If you can see styled text, Tailwind is working!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-2">Card 1</h2>
          <p className="text-muted-foreground">
            This card should have a background color and border.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-2">Card 2</h2>
          <p className="text-muted-foreground">
            This card should have a background color and border.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-2">Card 3</h2>
          <p className="text-muted-foreground">
            This card should have a background color and border.
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Primary Button
        </button>
        <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors">
          Secondary Button
        </button>
      </div>
    </div>
  );
}
