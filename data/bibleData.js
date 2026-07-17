// Flat 3D Bible Array Structure: [Book][Chapter][Verse]
// Lightweight format optimized for minimal data size
// Example structure - add full Bible content as needed

export const bible = [
  // Book 1: Genesis
  [
    // Chapter 1
    [
      "In the beginning God created the heavens and the earth.",
      "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
      "And God said, 'Let there be light:' and there was light.",
      "God saw that the light was good, and he separated the light from the darkness."
      // ... more verses
    ],
    // Chapter 2
    [
      "Thus the heavens and the earth were completed in all their vast array.",
      "By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.",
      "Then the LORD God took the man and put him in the Garden of Eden to work it and take care of it."
      // ... more verses
    ]
    // ... more chapters
  ],
  // Book 2: Exodus
  [
    // Chapter 1
    [
      "These are the names of the sons of Israel who went to Egypt with Jacob, each with his family:",
      "Reuben, Simeon, Levi and Judah;",
      "Issachar, Zebulun and Benjamin;"
      // ... more verses
    ]
    // ... more chapters
  ]
  // ... more books
];

// Helper function to access Bible content
export function getVerse(bookIndex, chapterIndex, verseIndex) {
  if (
    bible[bookIndex] &&
    bible[bookIndex][chapterIndex] &&
    bible[bookIndex][chapterIndex][verseIndex]
  ) {
    return bible[bookIndex][chapterIndex][verseIndex];
  }
  return null;
}

// Helper function to access full chapter
export function getChapter(bookIndex, chapterIndex) {
  if (bible[bookIndex] && bible[bookIndex][chapterIndex]) {
    return bible[bookIndex][chapterIndex];
  }
  return null;
}

// Helper function to access full book
export function getBook(bookIndex) {
  return bible[bookIndex] || null;
}

// Map book names to indices for easier access
export const bookNames = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  // ... add all 66 books (39 OT + 27 NT)
];

// Example usage:
// getVerse(0, 0, 0)  // Genesis 1:1
// getChapter(0, 0)   // Genesis Chapter 1
// getBook(0)         // Book of Genesis
