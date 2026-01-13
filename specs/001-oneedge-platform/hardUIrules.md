*** Absolute Rules to be followed ***
1. Fonts - SF Pro Display (light, regular, medium); fallback - Inter
2. Mobile interface - absolutely similar to chatGpt with below references | chat primary with projects and persistent memory, with voice animations of Sia (use ElevenLabs details), more color themes light, dark, coder, etc. Backend is the same Supabase. 
MOBILE APP REFERENCES:
- https://www.assistant-ui.com, https://www.assistant-ui.com/examples/grok, 
- components for thinking mode, tooling, etc - https://www.tool-ui.com/docs/gallery
- Sia feeback collector widget - <elevenlabs-convai agent-id="agent_8701keg7xdvgfx89gk8fspx7jk5x"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta" async type="text/javascript"></script>; 
- mobile app - light theme - colors:
:root {
  --radius: 0.5rem;
  --background: oklch(0.979 0.008 298.426);
  --foreground: oklch(0.108 0.03 298.039);
  --muted: oklch(0.946 0.012 298.351);
  --muted-foreground: oklch(0.423 0.019 297.776);
  --popover: oklch(0.979 0.008 298.426);
  --popover-foreground: oklch(0.108 0.03 298.039);
  --card: oklch(0.979 0.008 298.426);
  --card-foreground: oklch(0.108 0.03 298.039);
  --border: oklch(0.908 0.011 298.358);
  --input: oklch(0.908 0.011 298.358);
  --primary: oklch(0.205 0.032 295.665);
  --primary-foreground: oklch(0.926 0.038 289.658);
  --secondary: oklch(0.868 0.011 298.338);
  --secondary-foreground: oklch(0.345 0.022 297.469);
  --accent: oklch(0.868 0.011 298.338);
  --accent-foreground: oklch(0.345 0.022 297.469);
  --destructive: oklch(0.324 0.124 30.924);
  --destructive-foreground: oklch(0.803 0.109 25.422);
  --ring: oklch(0.205 0.032 295.665);
  --chart-1: oklch(0.205 0.032 295.665);
  --chart-2: oklch(0.868 0.011 298.338);
  --chart-3: oklch(0.868 0.011 298.338);
  --chart-4: oklch(0.893 0.009 298.387);
  --chart-5: oklch(0.203 0.036 295.299);
}

.dark {
  --radius: 0.5rem;
  --background: oklch(0.125 0.011 6.981);
  --foreground: oklch(0.991 0.002 6.648);
  --muted: oklch(0.162 0.015 8.938);
  --muted-foreground: oklch(0.741 0.013 7.049);
  --popover: oklch(0.125 0.011 6.981);
  --popover-foreground: oklch(0.991 0.002 6.648);
  --card: oklch(0.125 0.011 6.981);
  --card-foreground: oklch(0.991 0.002 6.648);
  --border: oklch(0.23 0.014 8.085);
  --input: oklch(0.23 0.014 8.085);
  --primary: oklch(0.214 0.027 9.798);
  --primary-foreground: oklch(0.746 0.052 8.316);
  --secondary: oklch(0.202 0.004 7.058);
  --secondary-foreground: oklch(0.751 0.009 6.903);
  --accent: oklch(0.202 0.004 7.058);
  --accent-foreground: oklch(0.751 0.009 6.903);
  --destructive: oklch(0.651 0.237 19.636);
  --destructive-foreground: oklch(1 0 180);
  --ring: oklch(0.214 0.027 9.798);
  --chart-1: oklch(0.214 0.027 9.798);
  --chart-2: oklch(0.202 0.004 7.058);
  --chart-3: oklch(0.202 0.004 7.058);
  --chart-4: oklch(0.235 0.005 7.107);
  --chart-5: oklch(0.213 0.03 10.179);
}
- Mobile app dark theme colors:
:root {
  --radius: 0.5rem;
  --background: oklch(0.971 0.003 286.35);
  --foreground: oklch(0 0 0);
  --muted: oklch(0.923 0.007 286.267);
  --muted-foreground: oklch(0 0 0);
  --popover: oklch(1 0 180);
  --popover-foreground: oklch(0 0 0);
  --card: oklch(1 0 180);
  --card-foreground: oklch(0 0 0);
  --border: oklch(0.923 0.007 286.267);
  --input: oklch(0.923 0.007 286.267);
  --primary: oklch(0.603 0.218 257.42);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(1 0 180);
  --secondary-foreground: oklch(0 0 0);
  --accent: oklch(0.963 0.007 286.274);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(0.663 0.224 28.292);
  --destructive-foreground: oklch(1 0 180);
  --ring: oklch(0.603 0.218 257.42);
  --chart-1: oklch(0.73 0.194 147.443);
  --chart-2: oklch(0.865 0.177 90.382);
  --chart-3: oklch(0.659 0.172 263.904);
  --chart-4: oklch(0.529 0.191 278.337);
  --chart-5: oklch(0.65 0.238 17.899);
}

.dark {
  --radius: 0.5rem;
  --background: oklch(0 0 0);
  --foreground: oklch(0.994 0 180);
  --muted: oklch(0.201 0.004 286.039);
  --muted-foreground: oklch(0.994 0 180);
  --popover: oklch(0.227 0.004 286.091);
  --popover-foreground: oklch(0.963 0.007 286.274);
  --card: oklch(0 0 0);
  --card-foreground: oklch(1 0 180);
  --border: oklch(0.201 0.002 286.221);
  --input: oklch(0.201 0.002 286.221);
  --primary: oklch(0.624 0.206 255.484);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(0.227 0.004 286.091);
  --secondary-foreground: oklch(1 0 180);
  --accent: oklch(0.294 0.004 286.177);
  --accent-foreground: oklch(1 0 180);
  --destructive: oklch(0.648 0.207 30.78);
  --destructive-foreground: oklch(1 0 180);
  --ring: oklch(0.624 0.206 255.484);
  --chart-1: oklch(0.77 0.224 144.965);
  --chart-2: oklch(0.885 0.181 94.786);
  --chart-3: oklch(0.817 0.119 227.748);
  --chart-4: oklch(0.556 0.203 278.151);
  --chart-5: oklch(0.65 0.238 17.899);
}
- Mobile app login - 


*** Web App Absolute requirements ***
1. Reference to theme and components - https://ui.shadcn.com/create?base=radix&baseColor=gray&theme=blue&iconLibrary=hugeicons&font=inter&menuAccent=subtle&menuColor=default&radius=small
2. Dashboard and metric components - https://github.com/satnaing/shadcn-admin
3. Web app dark theme colors:
:root {
  --radius: 0.5rem;
  --background: oklch(0.984 0.006 240.362);
  --foreground: oklch(0.09 0.013 230.195);
  --muted: oklch(0.946 0.005 240.349);
  --muted-foreground: oklch(0.418 0 170.538);
  --popover: oklch(0.976 0.008 240.403);
  --popover-foreground: oklch(0 0 0);
  --card: oklch(0.976 0.008 240.403);
  --card-foreground: oklch(0 0 0);
  --border: oklch(0.915 0.005 240.355);
  --input: oklch(0.915 0.005 240.355);
  --primary: oklch(0.512 0.138 249.306);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(0.884 0.007 240.396);
  --secondary-foreground: oklch(0.369 0.015 240.855);
  --accent: oklch(0.884 0.007 240.396);
  --accent-foreground: oklch(0.369 0.015 240.855);
  --destructive: oklch(0.342 0.12 31.712);
  --destructive-foreground: oklch(0.831 0.083 28.767);
  --ring: oklch(0.512 0.138 249.306);
  --chart-1: oklch(0.512 0.138 249.306);
  --chart-2: oklch(0.884 0.007 240.396);
  --chart-3: oklch(0.884 0.007 240.396);
  --chart-4: oklch(0.907 0.006 240.37);
  --chart-5: oklch(0.515 0.141 249.767);
}

.dark {
  --radius: 0.5rem;
  --background: oklch(0 0 0);
  --foreground: oklch(0.984 0.003 240.323);
  --muted: oklch(0.181 0.007 240.814);
  --muted-foreground: oklch(0.765 0 169.695);
  --popover: oklch(0.092 0 180);
  --popover-foreground: oklch(0.992 0.001 240.303);
  --card: oklch(0.092 0 180);
  --card-foreground: oklch(0.992 0.001 240.303);
  --border: oklch(0.215 0.006 240.687);
  --input: oklch(0.215 0.006 240.687);
  --primary: oklch(0.512 0.138 249.306);
  --primary-foreground: oklch(1 0 180);
  --secondary: oklch(0.226 0.001 240.366);
  --secondary-foreground: oklch(0.773 0.003 240.33);
  --accent: oklch(0.226 0.001 240.366);
  --accent-foreground: oklch(0.773 0.003 240.33);
  --destructive: oklch(0.645 0.206 31.59);
  --destructive-foreground: oklch(1 0 180);
  --ring: oklch(0.512 0.138 249.306);
  --chart-1: oklch(0.512 0.138 249.306);
  --chart-2: oklch(0.226 0.001 240.366);
  --chart-3: oklch(0.226 0.001 240.366);
  --chart-4: oklch(0.259 0.002 240.372);
  --chart-5: oklch(0.515 0.141 249.767);
}
- Web app light theme colors (primary only - rest use Shadcn)
:root {
  --radius: 0.5rem;
  --background: oklch(1 0 180);
  --foreground: oklch(0.141 0.004 285.824);
  --muted: oklch(0.968 0.001 286.375);
  --muted-foreground: oklch(0.552 0.014 285.942);
  --popover: oklch(1 0 180);
  --popover-foreground: oklch(0.141 0.004 285.824);
  --card: oklch(1 0 180);
  --card-foreground: oklch(0.141 0.004 285.824);
  --border: oklch(0.965 0 194.036);
  --input: oklch(0.697 0.147 235.754);
  --primary: oklch(0.641 0.19 253.216);
  --primary-foreground: oklch(0.985 0 180);
  --secondary: oklch(0.894 0.054 285.267);
  --secondary-foreground: oklch(0.21 0.006 285.883);
  --accent: oklch(0.968 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.883);
  --destructive: oklch(0.637 0.208 25.326);
  --destructive-foreground: oklch(0.985 0 180);
  --ring: oklch(0.21 0.006 285.883);
  --chart-1: oklch(0.677 0.157 35.19);
  --chart-2: oklch(0.631 0.101 183.491);
  --chart-3: oklch(0.379 0.044 225.539);
  --chart-4: oklch(0.834 0.119 88.146);
  --chart-5: oklch(0.783 0.126 58.749);
}

.dark {
  --radius: 0.5rem;
  --background: oklch(0.141 0.004 285.824);
  --foreground: oklch(0.985 0 180);
  --muted: oklch(0.274 0.005 286.033);
  --muted-foreground: oklch(0.712 0.013 286.068);
  --popover: oklch(0.141 0.004 285.824);
  --popover-foreground: oklch(0.985 0 180);
  --card: oklch(0.141 0.004 285.824);
  --card-foreground: oklch(0.985 0 180);
  --border: oklch(0.274 0.005 286.033);
  --input: oklch(0.274 0.005 286.033);
  --primary: oklch(0.985 0 180);
  --primary-foreground: oklch(0.21 0.006 285.883);
  --secondary: oklch(0.274 0.005 286.033);
  --secondary-foreground: oklch(0.985 0 180);
  --accent: oklch(0.274 0.005 286.033);
  --accent-foreground: oklch(0.985 0 180);
  --destructive: oklch(0.396 0.133 25.721);
  --destructive-foreground: oklch(0.985 0 180);
  --ring: oklch(0.871 0.005 286.285);
  --chart-1: oklch(0.529 0.193 262.129);
  --chart-2: oklch(0.698 0.134 165.463);
  --chart-3: oklch(0.723 0.15 60.631);
  --chart-4: oklch(0.619 0.204 312.728);
  --chart-5: oklch(0.612 0.209 6.386);
}
- Web background structure and animations - https://edra.tsuzat.com - https://github.com/Tsuzat/Edra
- 
*** BOTH MOBILE AND WEB GENERIC COMPONENTS FOR AI, MODEL HUB, PROMPT, PLAYGROUND ***
1. Reasoning - https://www.shadcn.io/ai/reasoning
2. Prompt input - https://www.shadcn.io/ai/prompt-input
3. AI model switcher - https://www.shadcn.io/components/navbar/navbar-13

*** ANIMATIONS ***
1. Automations page - node connectors - https://www.shadcn.io/components/special-effects/animated-beam
2. https://github.com/codse/animata

- Icons - https://www.shadcn.io/icons/material-symbols


*** ALL OTHER COMPONENTS TO FOLLOW SHADCN UI KIT https://ui.shadcn.com/create?base=radix&baseColor=gray&theme=blue&iconLibrary=hugeicons&font=inter&menuAccent=subtle&radius=small&item=preview - THEME 'MALA' ***

**** FINAL CHECKS - ABSOLUTELY MUST ****
1. No dummy data or buttons
2. Every single button / data point should always be linked to Supabase actual tables, no dummy
3. Models should be easily loaded and offloaded via virtual keys, no breaks
4. All tables within Supabase including functions should be RLS. 
5. Mobile apps properly functional, approved by the user and then ready to be deployed to specific sites mentioned in claude.md
6. Automations / Agents pages should be perfectly functioning absolutely matching claude.md requirements
7. UI pixel perfect
8. end to end tested
9. No security vulnerabilities
10. Should be high performance and highly scalable
