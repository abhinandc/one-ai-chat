import React from "react";
import { Heart, Github, Twitter, Linkedin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="fixed-footer glass-toolbar border-t border-border-primary bg-surface-graphite/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-accent-red animate-gentle-bounce" />
            <span>by OneAI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="p-2 text-text-tertiary hover:text-accent-blue hover:scale-110 transition-all duration-normal rounded-lg hover:bg-surface-graphite-hover"
            >
              <Github className="h-4 w-4" />
            </a>
            <a 
              href="#" 
              className="p-2 text-text-tertiary hover:text-accent-blue hover:scale-110 transition-all duration-normal rounded-lg hover:bg-surface-graphite-hover"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a 
              href="#" 
              className="p-2 text-text-tertiary hover:text-accent-blue hover:scale-110 transition-all duration-normal rounded-lg hover:bg-surface-graphite-hover"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};