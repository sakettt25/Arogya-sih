import { HeartPulse, Languages, MapPin, Stethoscope } from "lucide-react";

const features = [
  {
    name: "AI-Powered Medical Assistance",
    description:
      "Our AI analyzes symptoms and provides preliminary diagnoses, helping users understand their health conditions quickly.",
    icon: HeartPulse,
  },
  {
    name: "Multilingual Support",
    description:
      "Break language barriers with real-time translation, ensuring everyone can access medical help in their preferred language.",
    icon: Languages,
  },
  {
    name: "Location-Based Doctor Matching",
    description:
      "Find the nearest available doctors and medical facilities using GPS technology, ensuring timely assistance.",
    icon: MapPin,
  },
  {
    name: "Seamless Doctor Connection",
    description:
      "Connect instantly with healthcare professionals via video calls or chat for remote consultations and advice.",
    icon: Stethoscope,
  },
];

export default function Features() {
  return (
    <section className="container px-4 space-y-12 py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-[58rem] text-center">
        <h2 className="font-bold text-2xl leading-[1.2] sm:text-3xl md:text-5xl">
          Revolutionizing Rural Healthcare
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground">
          Empowering rural communities with AI-driven medical solutions, multilingual support, and instant access to healthcare professionals.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="relative overflow-hidden rounded-lg border bg-background p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <feature.icon className="h-6 w-6 sm:h-8 sm:w-8" />
              <h3 className="font-bold text-lg sm:text-xl">{feature.name}</h3>
            </div>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

