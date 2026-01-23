import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import GithubCodeBlock from "./components/github-code-block";
import { XEmbedClient } from "./components/XEmbedClient";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Callout } from "fumadocs-ui/components/callout";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/shadverse/components/card";
import { Alert, AlertTitle, AlertDescription } from "@repo/shadverse/components/alert";
import { Badge } from "@repo/shadverse/components/badge";
import { Separator } from "@repo/shadverse/components/separator";

import CodeDisplay from "./components/code-display";
import {
  ClampCalculator,
  VwCalculator,
  ScalingPreview,
  BreakpointComparison,
  TwoPointCalculator,
} from "./components/tools/ClampCalculator";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),

    Tab,
    Tabs,
    Step,
    Steps,
    Callout,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Alert,
    AlertTitle,
    AlertDescription,
    Badge,
    Separator,
    XEmbed: XEmbedClient,
    GithubCodeBlock: GithubCodeBlock,
    CodeDisplay,
    ClampCalculator,
    VwCalculator,
    ScalingPreview,
    BreakpointComparison,
    TwoPointCalculator,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
