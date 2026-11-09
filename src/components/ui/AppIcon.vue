<script setup lang="ts">
defineProps<{ name?: string }>()
const paths: Record<string, string> = {
  calendar: 'M3 5h18v16H3zM7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3',
  search: 'm21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
  clear: 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v7m4-7v7',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  trash: 'M3 6h18m-2 0-1 14H6L5 6m3 0V4h8v2m-6 4v7m4-7v7',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  play: 'm8 5 11 7-11 7z',
  'user-x': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-3 5 5m0-5-5 5',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4L16.5 3.5z',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  check: 'm5 12 4 4L19 6',
  xCircle: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM9 9l6 6m0-6-6 6',
  checkCircle: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM8 12l3 3 5-6',
  alertTriangle: 'M12 3 2 21h20L12 3zM12 9v5m0 3h.01',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  mail: 'M3 5h18v14H3zM3 5l9 7 9-7',
  'message-square': 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  briefcase: 'M3 7h18v14H3zM8 7V4h8v3M3 12h18',
  fileText: 'M6 2h9l5 5v15H6zM15 2v5h5M9 12h8M9 16h8',
  layers: 'm12 2 9 5-9 5-9-5 9-5zm-9 10 9 5 9-5m-18 5 9 5 9-5',
  userRound: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10',
  package: 'm12 2 9 5v10l-9 5-9-5V7l9-5zm-9 5 9 5 9-5m-9 5v10',
  chart: 'M3 3v18h18M7 16v-5m5 5V6m5 10V9',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-5h.01',
  building: 'M4 22V3h16v19M2 22h20M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3m0 14v3M4.9 4.9 7 7m10 10 2.1 2.1M2 12h3m14 0h3M4.9 19.1 7 17M17 7l2.1-2.1',
  creditCard: 'M2 5h20v14H2zM2 10h20M6 15h4',
  logout: 'M9 5H4v14h5m5-14 7 7-7 7m-6-7h13',
}
</script>
<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name ?? 'arrow']" />
  </svg>
</template>
