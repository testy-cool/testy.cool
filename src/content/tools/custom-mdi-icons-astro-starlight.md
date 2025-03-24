---
title: "Using Custom MDI Icons in Astro Starlight Card Components"
description: "How to extend the Astro Starlight Card component to accept custom icons"
pubDate: "2024-12-14"
author: "testycool"
image: "/images/custom-mdi-icons-astro-starlight/demo-custom-icon-cards.png"
tags: ["astro", "starlight", "icons", "components", "development"]
---

![Result, with custom icons](/images/custom-mdi-icons-astro-starlight/demo-custom-icon-cards.png)

By default you can only use [built-in icons](https://starlight.astro.build/reference/icons/) in cards in Astro Starlight.

Like this:

```mdx
<Card title="This is a card" icon="star">
  - ✨ Some text here
</Card>
```

And it will render like this:

![Example base card](/images/custom-mdi-icons-astro-starlight/example-base-card.png)

But you may want additional icons, that aren't built in. Like the `android` icon.

And if you try to use custom icons, such as from https://github.com/natemoo-re/astro-icon, you'll find that you can't use them in that colored square near the heading.

You can only use them outside, like this `<Icon name="filename" />`, at least I haven't found a way.

## The Solution

My solution has been to take the existing Astro Starlight Card component and edit it to allow usage of custom icons such as `mdi:help-circle-outline`, from Material Design Icons.

In your `src/components`, create a new filename `IconCard.astro` and paste this in:

```mdx
---
import { Icon } from 'astro-icon/components';

interface Props {
    title: string;
    icon: string;
}

const { title, icon } = Astro.props;
---

<article class="card sl-flex">
    <p class="title sl-flex">
        <Icon name={icon} class="icon" size="1.333em" />
        <span set:html={title} />
    </p>
    <div class="body"><slot /></div>
</article>

<style>
    .card {
        --sl-card-border: var(--sl-color-purple);
        --sl-card-bg: var(--sl-color-purple-low);
        border: 1px solid var(--sl-color-gray-5);
        background-color: var(--sl-color-black);
        padding: clamp(1rem, calc(0.125rem + 3vw), 2.5rem);
        flex-direction: column;
        gap: clamp(0.5rem, calc(0.125rem + 1vw), 1rem);
    }
    .card:nth-child(4n + 1) {
        --sl-card-border: var(--sl-color-orange);
        --sl-card-bg: var(--sl-color-orange-low);
    }
    .card:nth-child(4n + 3) {
        --sl-card-border: var(--sl-color-green);
        --sl-card-bg: var(--sl-color-green-low);
    }
    .card:nth-child(4n + 4) {
        --sl-card-border: var(--sl-color-red);
        --sl-card-bg: var(--sl-color-red-low);
    }
    .card:nth-child(4n + 5) {
        --sl-card-border: var(--sl-color-blue);
        --sl-card-bg: var(--sl-color-blue-low);
    }
    .title {
        font-weight: 600;
        font-size: var(--sl-text-h4);
        color: var(--sl-color-white);
        line-height: var(--sl-line-height-headings);
        gap: 1rem;
        align-items: center;
    }
    .card .icon {
        border: 1px solid var(--sl-card-border);
        background-color: var(--sl-card-bg);
        padding: 0.2em;
        border-radius: 0.25rem;
    }
    .card .body {
        margin: 0;
        font-size: clamp(var(--sl-text-sm), calc(0.5rem + 1vw), var(--sl-text-body));
    }
</style>
```

## Usage

Now you can create cards with custom icons. In your file where you want to use them import the new component we created and then use the `IconCard` instead of `Card`:

```mdx
import IconCard from '../../components/IconCard.astro';

<IconCard title="Android Setup" icon="mdi:android">
  - Something about android
</IconCard>
```

![result-after-custom-card](/images/custom-mdi-icons-astro-starlight/result-after-custom-card.png)

Hope that helps. Let me know if you encounter any issues and I'll try to help. 