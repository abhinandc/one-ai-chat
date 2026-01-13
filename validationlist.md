EdgeAdmin uses 1 api key from Claude (ex), and decides to give 2 models in that to employee A - via a virtual key and set limits (litellm similar) - data flow should all be via Supabase. I can provide you access to that schema. via mcp.
Yes, invited by EdgeAdmin and yes to SSO via Supabase. Yes, there will be Admins and employees
RLS should be enabled. and yes you need to use the same supabase project - tables already exist, but not for all I guess. Check the folder you created, I have added - supabase-schema-current.sql
A - start a new conversation with model and response pre-populated in the "chat window" - should be great animation for this transition. B - no follow up - CTA should "Choose this response + (model name), dashboard - every insane useful metric that you can imagine.
All important parameters needed. Yes, employees can choose to share agents.
like Secure Vault - you can call EdgeVault, Fetched from a template library admin maintains (admins should have config page for this), example automations - check my emails everyday from ASU and if it comes from Jane, forward it to Peter OR If someone sends me a google chat via space asking for details, draft a note, etc.. you can think of more innovative ones. (consider microsoft foundry, google opal, chatgpt agents - type automations)
yes, a tab for Playground or a dedicated collapsible section on the right; external feeds can be via apis/ links/ webhook automations - admins will set it up - not for each employee but employees can filter.
yes and yes
Flutter / expo? you suggest.. need is for both ios and android. Not exactly same code base, has to be more mobile centric and ease of use. But same DB.
we can use everything from elevenlabs to keep it simple for now - via their agents? Distinct persona/prompt, with persistent memory
different models, thinking, fast, etc. also include coding - mobile should have different UI themes. Projects should be via supabase tables with conversation IDs chuncked.. No offline chat, only cached conversations.
clean minimal with some bold edge to it. https://ui.shadcn.com/create?base=radix&style=mira&baseColor=gray&theme=blue&iconLibrary=hugeicons&font=inter&menuAccent=subtle&menuColor=default&radius=small&item=preview AND for mobile - https://www.assistant-ui.com/examples
And for both, you need to use shadcn mcp.. and I have provided some references below:
https://www.shadcn.io/icons/material-symbols
https://github.com/magicuidesign/magicui
https://shadcn-admin.netlify.app --> https://github.com/satnaing/shadcn-admin
https://github.com/codse/animata,

Theming for mobile app - :root {
--radius: 0.5rem;
--background: oklch(1 0 180);
--foreground: oklch(0 0 0);
--muted: oklch(0.953 0.002 22.233);
--muted-foreground: oklch(0.461 0.025 22.906);
--popover: oklch(1 0 180);
--popover-foreground: oklch(0 0 0);
--card: oklch(1 0 180);
--card-foreground: oklch(0 0 0);
--border: oklch(0.962 0 74.951);
--input: oklch(0.962 0 74.951);
--primary: oklch(0.874 0.087 73.746);
--primary-foreground: oklch(0.357 0.075 66.588);
--secondary: oklch(0.785 0.111 24.334);
--secondary-foreground: oklch(0.295 0.108 29.725);
--accent: oklch(0.954 0.122 111.787);
--accent-foreground: oklch(0.435 0.095 113.918);
--destructive: oklch(0.509 0.166 35.119);
--destructive-foreground: oklch(1 0 180);
--ring: oklch(0.874 0.087 73.746);
--chart-1: oklch(0.874 0.087 73.746);
--chart-2: oklch(0.785 0.111 24.334);
--chart-3: oklch(0.954 0.122 111.787);
--chart-4: oklch(0.812 0.095 23.883);
--chart-5: oklch(0.876 0.089 73.678);
}

.dark {
--radius: 0.5rem;
--background: oklch(0.12 0.011 81.096);
--foreground: oklch(1 0 180);
--muted: oklch(0.168 0.002 22.378);
--muted-foreground: oklch(0.704 0.022 22.596);
--popover: oklch(0.12 0.011 81.096);
--popover-foreground: oklch(1 0 180);
--card: oklch(0.12 0.011 81.096);
--card-foreground: oklch(1 0 180);
--border: oklch(0.227 0.001 74.916);
--input: oklch(0.227 0.001 74.916);
--primary: oklch(0.874 0.087 73.746);
--primary-foreground: oklch(0.357 0.075 66.588);
--secondary: oklch(0.785 0.111 24.334);
--secondary-foreground: oklch(0.295 0.108 29.725);
--accent: oklch(0.954 0.122 111.787);
--accent-foreground: oklch(0.435 0.095 113.918);
--destructive: oklch(0.659 0.183 36.14);
--destructive-foreground: oklch(0 0 0);
--ring: oklch(0.874 0.087 73.746);
--chart-1: oklch(0.874 0.087 73.746);
--chart-2: oklch(0.785 0.111 24.334);
--chart-3: oklch(0.954 0.122 111.787);
--chart-4: oklch(0.812 0.095 23.883);
--chart-5: oklch(0.876 0.089 73.678);
}

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
web app - :root {
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

All apps - light and dark theme
OneEdge logo - there in assets folder. for both light and dark theme.
10. Sia - create an identity.. similar to siri