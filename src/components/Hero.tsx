import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Users, MapPin, Calendar } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Transform Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Workforce Management
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Streamline time tracking, scheduling, and employee management with our comprehensive attendance solution. Built for modern businesses that value efficiency and accuracy.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              <Card className="p-4 text-center shadow-soft hover:shadow-medium transition-shadow">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">Time Tracking</p>
              </Card>
              <Card className="p-4 text-center shadow-soft hover:shadow-medium transition-shadow">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">Smart Scheduling</p>
              </Card>
              <Card className="p-4 text-center shadow-soft hover:shadow-medium transition-shadow">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">Team Management</p>
              </Card>
              <Card className="p-4 text-center shadow-soft hover:shadow-medium transition-shadow">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">Geolocation</p>
              </Card>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-large">
              <img 
                src={heroDashboard} 
                alt="Time and Attendance Dashboard" 
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;