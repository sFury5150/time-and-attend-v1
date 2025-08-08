import { Clock, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">TimeTracker Pro</span>
            </div>
            <p className="text-background/70 leading-relaxed">
              The most comprehensive time and attendance management solution for modern businesses.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Features</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Pricing</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">API</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">About</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Blog</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Careers</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span className="text-background/70 text-sm">support@timetracker.pro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span className="text-background/70 text-sm">1-800-TIME-PRO</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="text-background/70 text-sm">San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center">
          <p className="text-background/70 text-sm">
            © 2024 TimeTracker Pro. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;