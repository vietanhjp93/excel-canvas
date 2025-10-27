import React from "react";
import { DataEditorAll as DataEditor } from "../../data-editor-all.js";
import {
    BeautifulWrapper,
    Description,
    PropName,
    useMockDataGenerator,
    defaultProps,
} from "../../data-editor/stories/utils.js";
import { SimpleThemeWrapper } from "../../stories/story-utils.js";

export default {
    title: "Glide-Data-Grid/DataEditor Demos",

    decorators: [
        (Story: React.ComponentType) => (
            <SimpleThemeWrapper>
                <BeautifulWrapper
                    title="Custom Border Width"
                    description={
                        <Description>
                            The <PropName>highlightRegions</PropName> prop now supports custom{" "}
                            <PropName>borderWidth</PropName> for each highlight region.
                        </Description>
                    }>
                    <Story />
                </BeautifulWrapper>
            </SimpleThemeWrapper>
        ),
    ],
};

export const CustomBorderWidth: React.VFC = () => {
    const { cols, getCellContent } = useMockDataGenerator(60);

    // ✅ Different border widths for different regions
    const highlightRegions = [
        {
            color: "#FF0000",
            range: {
                x: 2,
                y: 5,
                width: 4,
                height: 3,
            },
            style: "solid-outline" as const,
            borderWidth: 1,  // ✅ Thin border (1px)
        },
        {
            color: "#0000FF",
            range: {
                x: 8,
                y: 5,
                width: 4,
                height: 3,
            },
            style: "solid-outline" as const,
            borderWidth: 3,  // ✅ Medium border (3px)
        },
        {
            color: "#00FF00",
            range: {
                x: 14,
                y: 5,
                width: 4,
                height: 3,
            },
            style: "solid-outline" as const,
            borderWidth: 5,  // ✅ Thick border (5px)
        },
        {
            color: "#FF9800",
            range: {
                x: 2,
                y: 10,
                width: 10,
                height: 5,
            },
            style: "solid" as const,
            borderWidth: 2,  // ✅ Border with fill (2px)
        },
        {
            color: "#9C27B0",
            range: {
                x: 14,
                y: 10,
                width: 5,
                height: 5,
            },
            style: "dashed" as const,
            borderWidth: 4,  // ✅ Dashed border (4px)
        },
    ];

    return (
        <DataEditor
            {...defaultProps}
            getCellContent={getCellContent}
            columns={cols}
            rowMarkers="both"
            highlightRegions={highlightRegions}
            rows={100}
        />
    );
};
