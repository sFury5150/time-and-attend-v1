import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

const CallToAction = () => {
  const benefits = [
    "14-day free trial",
    "No setup fees",
    "Cancel anytime",
    "24/7 support"
  ];

  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto p-12 text-center shadow-large border-0">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ready to Transform Your{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Workforce Management?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust TimeTracker Pro to manage their employee time and attendance efficiently.
          </p>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;