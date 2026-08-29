export function SiteFooter() {
  return (
    <footer className="mt-6">
      <div className="gold-rule h-px w-full" />
      <div className="bg-secondary/50 py-10 text-center">
        <p className="font-display text-lg text-primary">Global Costumes &amp; Draperies</p>
        <p className="mt-3 text-sm text-muted-foreground">Contact for more details</p>
        <p className="mt-1 text-base">
          <a href="tel:+918308504362" className="font-medium text-primary hover:underline transition-colors">
            +91 83085 04362
          </a>
        </p>
      </div>
    </footer>
  );
}
