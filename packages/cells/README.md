<h1 align="center">
  <img src="https://raw.githubusercontent.com/glideapps/glide-data-grid/master/media/icon.png" width="224px"/><br/>
  <b>Excel Canvas</b>
</h1>
<p align="center">A canvas-based data grid, supporting <b>millions</b> of rows, <b>rapid</b> updating, and <b>native scrolling</b>.</p>

<p align="center">Based on <a href="https://github.com/glideapps/glide-data-grid" target="_blank">Glide Data Grid</a> with enhanced features for Excel-like editing experience.</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/glideapps/glide-data-grid/master/media/data-grid-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/glideapps/glide-data-grid/master/media/data-grid.png">
  <img alt="Glide Data Grid with sample data" src="https://raw.githubusercontent.com/glideapps/glide-data-grid/master/media/data-grid.png">
</picture>

[![Version](https://img.shields.io/npm/v/excel-canvas?color=blue&label=latest&style=for-the-badge)](https://www.npmjs.com/package/excel-canvas)
[![React 16-19](https://img.shields.io/badge/React-16--19-00ADD8?style=for-the-badge&logo=react)](https://reactjs.org)
[![License](https://img.shields.io/github/license/glideapps/glide-data-grid?color=red&style=for-the-badge)](https://github.com/glideapps/glide-data-grid/blob/main/LICENSE)
[![Based on Glide Data Grid](https://img.shields.io/badge/Based_on-Glide_Data_Grid-11CCE5?style=for-the-badge)](https://github.com/glideapps/glide-data-grid)

# 👩‍💻 Demo and features

Lots of fun examples are in the original [Glide Data Grid Storybook](https://glideapps.github.io/glide-data-grid).

You can also visit the [Glide Data Grid main site](https://grid.glideapps.com) for comprehensive documentation.

## ✨ Excel Canvas Enhanced Features

This library extends Glide Data Grid with additional features optimized for Excel-like editing:

### 🆕 New Features

-   **Auto Row Height** - Rows automatically resize based on content
-   **Text Wrapping by Default** - `allowWrapping` defaults to `true` for better text display
-   **Enhanced Multi-Select Cell**
    -   Single selection mode with `allowSingleSelect` option
    -   Fixed editor value updates on Enter/Tab
-   **Advanced Text Editing**
    -   Content alignment support in textarea edit mode (`contentAlign`)
    -   Fixed trim space behavior for text cells
    -   Improved text wrapping and measurement
-   **Visual Enhancements**
    -   Customizable border width for `highlightRegions`
    -   Add row markers at grid edges
    -   History diff custom rendering with text wrapping
-   **Improved UX**
    -   Select behavior options for cell selection
    -   Option to disable edge add row functionality
    -   Better horizontal scroll handling with `smoothScrollX` + `autoRowHeight`

### 🐛 Bug Fixes

-   Fixed horizontal scroll layout bugs with `autoRowHeight` and grow columns
-   Fixed MultiSelectCell editor saving old values on Enter/Tab
-   Fixed text cell measurement (short text expands to actual width, long text capped at 500px)
-   Fixed MarkdownCell, RowIDCell, UriCell measurement
-   Improved column grow distribution

## Core Features (from Glide Data Grid)

-   **It scales to millions of rows**. Cells are rendered lazily on demand for memory efficiency.
-   **Scrolling is extremely fast**. Native scrolling keeps everything buttery smooth.
-   **Supports multiple types of cells**. Numbers, text, markdown, bubble, image, drilldown, uri
-   **Fully Free & Open Source**. [MIT licensed](LICENSE), so you can use Grid in commercial projects.
-   **Editing is built in**.
-   **Resizable and movable columns**.
-   **Variable sized rows**.
-   **Merged cells**.
-   **Single and multi-select rows, cells, and columns**.
-   **Cell rendering can be fully customized**.

# ⚡ Quick Start

First make sure you are using React 16 or greater (including React 17, 18, and 19). Then install excel-canvas:

```shell
npm i excel-canvas
```

You may also need to install the peer dependencies if you don't have them already:

```shell
npm i lodash marked react-responsive-carousel
```

Create a new `DataEditor` wherever you need to display lots and lots of data

```tsx
import DataEditor from "excel-canvas";
import "excel-canvas/dist/index.css";

<DataEditor getCellContent={getData} columns={columns} rows={numRows} />
```

Making your columns is easy

```ts
// Grid columns may also provide icon, overlayIcon, menu, style, and theme overrides
const columns: GridColumn[] = [
    { title: "First Name", width: 100 },
    { title: "Last Name", width: 100 },
];
```

Last provide data to the grid

```ts
// If fetching data is slow you can use the DataEditor ref to send updates for cells
// once data is loaded.
function getData([col, row]: Item): GridCell {
    const person = data[row];

    if (col === 0) {
        return {
            kind: GridCellKind.Text,
            data: person.firstName,
            allowOverlay: true,
            displayData: person.firstName,
        };
    } else if (col === 1) {
        return {
            kind: GridCellKind.Text,
            data: person.lastName,
            allowOverlay: true,
            displayData: person.lastName,
        };
    } else {
        throw new Error();
    }
}
```

## 📖 Full API documentation

Excel Canvas is fully compatible with Glide Data Grid API. Please refer to:

- [Glide Data Grid Official Documentation](https://docs.grid.glideapps.com/)
- [Glide Data Grid Storybook Examples](https://glideapps.github.io/glide-data-grid)
- [Original API Documentation](packages/core/API.md)

# 📒 FAQ

**What is Excel Canvas?**

Excel Canvas is an enhanced version of [Glide Data Grid](https://github.com/glideapps/glide-data-grid) with additional features focused on Excel-like editing experience, including auto row height, improved text wrapping, enhanced multi-select cells, and better horizontal scrolling.

**Nothing shows up!**

Please read the [Prerequisites section in the docs](packages/core/API.md).

**It crashes when I try to edit a cell!**

Please read the [Prerequisites section in the docs](packages/core/API.md).

**Does it work with screen readers and other a11y tools?**

Yes. The underlying Glide Data Grid supports accessibility features. Bug reports welcome!

**Does it support my data source?**

Yes.

Excel Canvas (like Glide Data Grid) is agnostic about the way you load/store/generate/mutate your data. What it requires is that you tell it which columns you have, how many rows, and to give it a function it can call to get the data for a cell in a specific row and column.

**Does it do sorting, searching, and filtering?**

Search is included. You provide the trigger, we do the search. [Example](https://glideapps.github.io/glide-data-grid/?path=/story/glide-data-grid-docs--search) in the original Glide Data Grid storybook.

Filtering and sorting are something you would have to implement with your data source. There are hooks for adding column header menus if you want that.

**Can it do frozen columns?**

Yes!

**Can I render my own cells?**

Yes, but the renderer has to use HTML Canvas. [Simple example](https://glideapps.github.io/glide-data-grid/?path=/story/glide-data-grid-dataeditor-demos--draw-custom-cells) in the original Storybook.

**Why does Excel Canvas use HTML Canvas?**

Excel Canvas inherits the canvas-based rendering from Glide Data Grid for superior scrolling performance. Traditional DOM-based virtualized grids struggle with smooth scrolling when displaying hundreds of cells. Canvas rendering eliminates this bottleneck.

**I want to use this with Next.js / Vercel, but I'm getting weird errors**

The easiest way to use the grid with Next is to create a component which wraps up your grid and then import it as a dynamic.

home.tsx

```tsx
import type { NextPage } from "next";
import dynamic from "next/dynamic";
import styles from "../styles/Home.module.css";

const Grid = dynamic(
    () => {
        return import("../components/Grid");
    },
    { ssr: false }
);

export const Home: NextPage = () => {
    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.title}>Hi</h1>
                <Grid />
            </main>
        </div>
    );
};
```

grid.tsx

```tsx
import React from "react";
import DataEditor from "excel-canvas";

export default function Grid() {
    return <DataEditor {...args} />;
}
```

## 🔗 Related Links

- [Original Glide Data Grid](https://github.com/glideapps/glide-data-grid)
- [Glide Data Grid Documentation](https://docs.grid.glideapps.com/)
- [Glide Data Grid Storybook](https://glideapps.github.io/glide-data-grid)

## 📝 Changelog

See [CHANGELOG.md](packages/core/CHANGELOG.md) for version history and changes.

## 📄 License

MIT - Same as the original Glide Data Grid. See [LICENSE](LICENSE) for details.
