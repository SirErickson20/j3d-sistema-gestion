import os

fpath = r"C:\Users\PCBOX\.gemini\antigravity\brain\55709b90-ebf1-4191-929f-3bc86b669e89\.system_generated\steps\337\content.md"
dest = r"C:\Users\PCBOX\Desktop\Proyecto\tienda3d.html"

if os.path.exists(fpath):
    text = open(fpath, "r", encoding="utf-8").read()
    # Search for u003chtml
    m = text.find("u003chtml")
    if m != -1:
        # Search for closing html tag
        end = text.find("u003c/html", m)
        if end != -1:
            sub = text[m:end + 15]
            # Decode escape sequences
            sub = sub.replace("\\u003c", "<")
            sub = sub.replace("\\u003e", ">")
            sub = sub.replace("\\u0026", "&")
            sub = sub.replace("\\u003d", "=")
            sub = sub.replace("\\\"", "\"")
            sub = sub.replace("\\n", "\n")
            sub = sub.replace("\\t", "\t")
            sub = sub.replace("u003chtml", "<html")
            sub = sub.replace("u003c/html", "</html")
            
            # Write to destination
            open(dest, "w", encoding="utf-8").write(sub)
            print(f"Success! Extracted {len(sub)} characters to {dest}")
        else:
            print("Closing tag not found")
    else:
        print("Opening tag not found")
else:
    print("Source file not found")
