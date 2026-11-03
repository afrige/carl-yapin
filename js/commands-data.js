/* Carl — command directory data.
   IMPORTANT: Only the three commands below existed in the original site and they were
   explicitly labelled as examples. They are NOT verified against the bot's source.
   Replace this list with the real command set, then set `verified: true` on each entry
   (and `prefixVerified: true`) so the "unverified" labels disappear. */
window.CARL_COMMANDS = {
  prefix: "c!",
  prefixVerified: false,
  categories: [
    { id: "general", label: "General" },
    { id: "info", label: "Information" }
  ],
  commands: [
    { name: "help", category: "general", description: "Show available commands.", usage: "c!help", verified: false },
    { name: "ping", category: "general", description: "Check whether Carl is responding.", usage: "c!ping", verified: false },
    { name: "serverinfo", category: "info", description: "Display basic server details.", usage: "c!serverinfo", verified: false }
  ]
};
