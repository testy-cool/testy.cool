# Prints the Flesch-Kincaid grade of blog posts. Run with: pnpm note:grade /absolute/path/to/post.mdx (relative paths resolve from apps/web)
# Strips frontmatter, JSX, imports and code spans first. The score ignores
# jargon, so it is a floor, not a pass.
import re, sys, textstat
for p in sys.argv[1:]:
    s = open(p).read()
    s = re.sub(r'^---.*?---', '', s, flags=re.S)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'^import .*$', '', s, flags=re.M)
    s = re.sub(r'`[^`]*`', 'code', s)
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = re.sub(r'^#+ ', '', s, flags=re.M)
    s = re.sub(r'\*\*', '', s)
    print(p.split('/')[-1], 'FK grade', round(textstat.flesch_kincaid_grade(s),1), 'ease', round(textstat.flesch_reading_ease(s)), 'words/sentence', round(textstat.words_per_sentence(s),1))
