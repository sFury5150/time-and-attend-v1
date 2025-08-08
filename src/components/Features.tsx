import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import timeTrackingIcon from "@/assets/time-tracking-icon.jpg";
import scheduleManagementIcon from "@/assets/schedule-management-icon.jpg";
import userManagementIcon from "@/assets/user-management-icon.jpg";
import geolocationIcon from "@/assets/geolocation-icon.jpg";

const Features = () => {
  const features = [
    {
      title: "Smart Time Tracking",
      description: "Automated time tracking with clock-in/out functionality, break management, and overtime calculations. Real-time monitoring keeps your team accountable.",
      image: timeTrackingIcon,
      benefits: ["Automated overtime calculation", "Real-time monitoring", "Mobile clock-in/out"],
      badge: "Core Feature"
    },
    {
      title: "Schedule Management",
      description: "Advanced scheduling tools for supervisors and managers. Create shifts, manage availability, and handle time-off requests with ease.",
      image: scheduleManagementIcon,
      benefits: ["Drag-and-drop scheduling", "Conflict resolution", "Shift templates"],
      badge: "Management"
    },
    {
      title: "User Management",
      description: "Comprehensive employee management system with role-based access, department organization, and detailed employee profiles.",
      image: userManagementIcon,
      benefits: ["Role-based permissions", "Department hierarchy", "Employee profiles"],
      badge: "Administration"
    },
    {
      title: "Geolocation Tracking",
      description: "Location-based attendance with client site management, GPS verification, and location restrictions for enhanced security.",
      image: geolocationIcon,
      benefits: ["GPS clock-in verification", "Client location management", "Geo-fencing"],
      badge: "Security"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Powerful Features for Modern Workforce Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to manage employee time, schedules, and attendance in one comprehensive platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-0 shadow-soft">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {feature.badge}
                  </Badge>
                </div>
                <div className="relative">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;