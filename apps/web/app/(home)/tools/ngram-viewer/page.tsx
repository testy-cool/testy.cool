import Link from "next/link";
import { DocsDescription, DocsTitle } from "fumadocs-ui/page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";
import { NgramViewer } from "@/components/tools/NgramViewer";
import { createMetadata } from "@/lib/metadata";

const description =
  "Free online n-gram viewer and phrase frame analyzer. Paste any text to count word sequences (bigrams, trigrams, 4-grams, 5-grams), find collocations, and extract phrase frames — n-grams with one variable slot that group templatic patterns like (intrat|impus) pe piața din românia into a single entry. Runs entirely in your browser.";

export const metadata = createMetadata({
  title: "N-gram Viewer & Phrase Frames",
  description,
  openGraph: {
    title: "N-gram Viewer & Phrase Frames | testy.cool",
    description,
  },
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "N-gram Viewer & Phrase Frames",
  description,
  url: "https://testy.cool/tools/ngram-viewer",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function NgramViewerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="text-center">
          <Breadcrumb className="mb-4 flex justify-center">
            <BreadcrumbList className="justify-center">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/tools">Tools</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>N-gram Viewer</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle className="dark:text-white">
            N-gram Viewer & Phrase Frames
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            {description}
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <NgramViewer />
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold mb-3 text-fd-foreground">
            What this tool does
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            This is a free online n-gram viewer and phrase frame analyzer.
            Paste any text — an article, a book chapter, a corpus of tweets,
            a transcript, a scraped dataset — and it does two things. First,
            it counts every n-gram (every sequence of N consecutive words) in
            the text and shows you the most frequent ones. Second, it extracts{" "}
            <strong>phrase frames</strong>: n-grams with one variable slot, so
            you can see templatic patterns that plain frequency counts miss.
            Everything runs locally in your browser. Nothing is uploaded,
            logged, or sent to any server.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Unlike the Google Books Ngram Viewer, which charts word frequencies
            over time across a fixed corpus, this tool analyzes whatever text{" "}
            <em>you</em> paste. That makes it useful for your own writing,
            your own scraped data, your own research corpus, or any other body
            of text that isn&apos;t in Google&apos;s index.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            What is an n-gram?
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            An n-gram is just a sequence of N consecutive words from a text.
            A 1-gram (unigram) is a single word. A 2-gram (bigram) is a pair
            of adjacent words. A 3-gram (trigram) is three in a row. And so
            on. Take the sentence{" "}
            <em>&quot;the quick brown fox jumps&quot;</em>. Its bigrams are{" "}
            <code className="font-mono">the quick</code>,{" "}
            <code className="font-mono">quick brown</code>,{" "}
            <code className="font-mono">brown fox</code>,{" "}
            <code className="font-mono">fox jumps</code>. Its trigrams are{" "}
            <code className="font-mono">the quick brown</code>,{" "}
            <code className="font-mono">quick brown fox</code>,{" "}
            <code className="font-mono">brown fox jumps</code>.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Counting n-grams across a large chunk of text surfaces repeated
            phrases. It&apos;s the foundation of a lot of corpus linguistics
            work, stylometric analysis, phrase mining, keyword extraction,
            and cliché-hunting.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Phrase frames — n-grams with a variable slot
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Plain n-gram counts have a weakness. Consider these two Romanian
            phrases: <em>&quot;a intrat pe piața din România&quot;</em> and{" "}
            <em>&quot;s-a impus pe piața din România&quot;</em>. They&apos;re
            clearly the same underlying pattern (<em>&quot;entered / established
            itself on the Romanian market&quot;</em>) but each surface form may
            only appear once or twice, so neither rises in a plain frequency
            list. The shared core{" "}
            <code className="font-mono">pe piața din românia</code> shows up
            but the verb that sits in front of it is lost.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            A <strong>phrase frame</strong> (also called a p-frame in corpus
            linguistics) fixes this. It&apos;s an n-gram with one position
            replaced by a wildcard. The frame{" "}
            <code className="font-mono">* pe piața din românia</code> collects{" "}
            every word that ever appeared in that slot — {" "}
            <code className="font-mono">intrat</code>,{" "}
            <code className="font-mono">impus</code>,{" "}
            <code className="font-mono">pătruns</code>,{" "}
            <code className="font-mono">extins</code>, and so on — and
            displays them together as{" "}
            <code className="font-mono">
              (intrat|impus|pătruns|extins) pe piața din românia
            </code>
            , with the total count across all variants.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            This is how you find templatic expressions, collocations,
            construction patterns, and formulaic writing that plain frequency
            counts can&apos;t see because each surface variant is rare on its
            own but the underlying template is common.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Controls
          </h2>
          <ul className="list-disc pl-6 text-base leading-relaxed text-fd-muted-foreground space-y-2 mb-4">
            <li>
              <strong>N</strong> — the size of each n-gram, from 1 (single
              words) up to 7.
            </li>
            <li>
              <strong>Min count</strong> — hide n-grams or frames that occur
              fewer than this many times.
            </li>
            <li>
              <strong>Slot position</strong> (frames only) — pin the wildcard
              to a specific word position, or let any position be the slot.
            </li>
            <li>
              <strong>Min variants</strong> (frames only) — only show frames
              where at least this many different words fill the slot. Higher
              values surface more productive templates.
            </li>
            <li>
              <strong>Filter</strong> — text search across the visible
              n-grams or frames. Matches against fillers too on the frame view.
            </li>
            <li>
              <strong>Export CSV</strong> — download whatever is currently
              shown for further analysis in a spreadsheet.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Who uses n-gram analysis?
          </h2>
          <ul className="list-disc pl-6 text-base leading-relaxed text-fd-muted-foreground space-y-2 mb-4">
            <li>
              <strong>Writers and editors</strong> hunting their own crutch
              phrases, clichés, and repetitive sentence openers. Paste a draft
              and the 3-grams you use too often will float to the top.
            </li>
            <li>
              <strong>SEO and content teams</strong> mining competitor content
              for repeated keyword phrases, title patterns, and formulaic
              copy that signals what a niche rewards.
            </li>
            <li>
              <strong>Corpus linguists and researchers</strong> studying
              collocations, lexical bundles, and phraseology. Phrase frames
              are the standard way to find productive templates in a corpus.
            </li>
            <li>
              <strong>Language learners</strong> spotting set expressions and
              idiomatic templates by pasting native-speaker text.
            </li>
            <li>
              <strong>NLP and ML engineers</strong> doing quick exploratory
              analysis on a dataset before committing to a preprocessing
              pipeline.
            </li>
            <li>
              <strong>Prompt engineers</strong> auditing LLM output for
              repetitive phrasing, templated transitions, or the kind of
              stock language that makes AI-generated text recognizable.
            </li>
            <li>
              <strong>Journalists and forensic linguists</strong> comparing
              writing styles, detecting plagiarism, or attributing authorship.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            How it works
          </h2>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            The text is tokenized with a Unicode-aware regex that keeps letters,
            digits, and internal hyphens or apostrophes, and splits on
            everything else. Tokens are lowercased by default (you can turn
            that off). The tool then slides a window of size N across the
            token stream and counts every distinct n-gram it sees.
          </p>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            For phrase frames, it takes each n-gram and generates N skeletons
            — one per position — by replacing that position with a wildcard.
            N-grams that share a skeleton get grouped together, and the words
            that filled the wildcard slot are collected as the frame&apos;s
            fillers. Frames with only one filler are discarded (they&apos;re
            just regular n-grams). Frames with many fillers are more
            productive templates.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            FAQ
          </h2>
          <h3 className="text-base font-semibold mt-4 mb-2 text-fd-foreground">
            Is my text sent to a server?
          </h3>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            No. All processing happens in your browser with JavaScript.
            There&apos;s no backend. You can paste confidential drafts,
            unpublished manuscripts, or client data and nothing leaves the
            page. Disconnect from the internet after loading the page and it
            still works.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-fd-foreground">
            What&apos;s the maximum text size?
          </h3>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            There&apos;s no hard limit, but the n-gram and frame computation
            runs synchronously, so extremely large inputs (hundreds of
            thousands of words) may freeze the tab briefly. For typical use —
            articles, essays, chapters, scraped pages, subtitle files — it&apos;s
            instant.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-fd-foreground">
            Does it handle non-English text?
          </h3>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Yes. The tokenizer uses Unicode letter classes, so Romanian,
            French, German, Spanish, Russian, Greek, Arabic, Chinese,
            Japanese, Korean and other scripts all work. Diacritics are
            preserved. Any language that separates words with whitespace or
            punctuation is supported.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-fd-foreground">
            What&apos;s the difference between an n-gram and a phrase frame?
          </h3>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            An n-gram is a fixed sequence of N words. A phrase frame is an
            n-gram with one position replaced by a wildcard, so multiple
            surface variants get grouped together. Plain n-grams miss
            templatic patterns where each variant is rare; phrase frames
            catch them.
          </p>

          <h3 className="text-base font-semibold mt-4 mb-2 text-fd-foreground">
            Can I exclude punctuation, numbers, or stopwords?
          </h3>
          <p className="text-base leading-relaxed text-fd-muted-foreground mb-4">
            Punctuation is already excluded by the tokenizer. Numbers are
            kept as tokens. There&apos;s no stopword filter — stopword lists
            are always language-specific, often wrong for your domain, and
            tend to hide the exact function-word patterns that phrase frames
            are good at surfacing. If you really need to remove common words,
            strip them from your text before pasting.
          </p>

          <h2 className="text-xl font-semibold mb-3 mt-10 text-fd-foreground">
            Tips
          </h2>
          <ul className="list-disc pl-6 text-base leading-relaxed text-fd-muted-foreground space-y-2">
            <li>
              Use larger N (4–6) with phrase frames to find long templatic
              expressions. Small N tends to just surface common bigrams.
            </li>
            <li>
              Click <em>all fillers</em> on any frame row to see every word
              that appeared in the slot and how often.
            </li>
            <li>
              Tokenization is Unicode-aware — Romanian diacritics, Cyrillic,
              Greek, CJK and other scripts all work.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
