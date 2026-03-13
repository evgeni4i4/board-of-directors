import { MessageSquare, Users, Lightbulb } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Describe",
    description: "Tell us your business challenge, decision, or idea in plain English.",
  },
  {
    icon: Users,
    title: "Select",
    description: "We recommend the best advisors — or pick your own from 30+ thinkers.",
  },
  {
    icon: Lightbulb,
    title: "Read",
    description: "Get distinct perspectives, a synthesis of agreements and disagreements, and a clear next step.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border/40 bg-zinc-50/50 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Three steps to expert-level strategic advice
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Step {i + 1}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
