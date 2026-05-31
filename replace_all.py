import os

replacements = {
    "text-gold": "text-[hsl(var(--primary))]",
    "text-text-primary": "text-foreground",
    "text-text-secondary": "text-muted-foreground",
    "text-muted": "text-muted-foreground",
    "text-green": "text-[hsl(var(--income))]",
    "text-red": "text-[hsl(var(--destructive))]",
    "text-amber": "text-[hsl(var(--warning))]",
    "bg-gold": "bg-[hsl(var(--primary))]",
    "bg-gold-dim": "bg-[hsl(var(--primary))]/10",
    "bg-green": "bg-[hsl(var(--income))]",
    "bg-green-dim": "bg-[hsl(var(--income))]/10",
    "bg-red": "bg-[hsl(var(--destructive))]",
    "bg-red-dim": "bg-[hsl(var(--destructive))]/10",
    "bg-amber": "bg-[hsl(var(--warning))]",
    "bg-amber-dim": "bg-[hsl(var(--warning))]/10",
    "stroke-gold": "stroke-[hsl(var(--primary))]",
    "stroke-green": "stroke-[hsl(var(--income))]",
    "stroke-amber": "stroke-[hsl(var(--warning))]",
    "stroke-red": "stroke-[hsl(var(--expense))]",
    "surface-1": "bg-card border border-[hsl(var(--border))] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]",
    "surface-2": "bg-[hsl(var(--muted))]",
    "surface-3": "bg-background",
    "border-border-subtle": "border-[hsl(var(--border))]",
    "border-border-visible": "border-[hsl(var(--border))]",
    "page-tag": "text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground",
    "caption": "text-[10px] font-semibold uppercase tracking-[0.1em]",
    "rounded-xl": "rounded-2xl",
    "rounded-lg": "rounded-xl",
    "rounded-md": "rounded-lg",
    "text-[30px] leading-[36px] font-display font-medium text-text-primary": "font-display text-2xl font-semibold text-foreground",
    "text-[30px] leading-[36px] font-display font-medium text-foreground": "font-display text-2xl font-semibold text-foreground",
    "space-y-2": "space-y-1"
}

files = [
    "app/goals/page.tsx",
    "app/analytics/page.tsx",
    "app/settings/page.tsx",
    "components/settings/ExportData.tsx",
    "components/settings/DeleteData.tsx",
    "components/ai-advisor/ChatInterface.tsx",
    "components/ai-advisor/ChatMessage.tsx"
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, "r") as f:
        content = f.read()
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(filepath, "w") as f:
        f.write(content)

print("Done all replacements")
