// lib/format.ts
export function formatEnumValue(value?: string | null): string {
    if (!value) return "-";

    return value
        .split("_")
        .map((word) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
}
