### Changes to Implement ###
1. Home screen - based on users message, it should auto load the correct 4 models (rank based). Logic should be common and should be driven by Supabase backend
2. Once user types this message, there should be modern close icon, to load back the dashboard
3. Chat page - the circle in the center - make it animated like pulse. 
B. Thinking mode not working
C. Too many plugins installed for chat modal interface, feels buggy.. it should be smooth animations
D. Right slider - model settings - should all be extrememly useful and functional, all settings should be saved against the user table in Supabase
4. Agents page - currently lists all the n8n projects and its status with workflows - but it doesnt save n8n details in supabase - fix it - should be saved against the user.
- Redesign this page with more useful components for my employees to build actual agents / share agents / etc, everything should be stored against the user in Supabase
5. Automations page - completely reimagine this design - I want it to be comprehensive to build great automations (process automations relevant to employees, they can use agents they buiult on the other page or use shared agents, configure mcp, etc.)
11. Model hub - ensure the data is flowing propoerly from the edge function and supabase tables - you also need to load and track specific model end points and should not confuse the user. All these details should be fetched from the actual models added via EdgeAdmin. Depending on the chat message (type of message - code request, chat, image, etc) - you automatically load the correct end point model from the available model library. If a specific endpoint is not available for the requested type - notify the user. No dummy or demo content here, should be all real data stored and retreieved from Supabase project - which is the same project used by EdgeAdmin as well.
