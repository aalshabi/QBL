export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold text-accent">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl">{title}</h1>
      {description ? <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
