#!/usr/bin/env node
'use strict';
// Generate Release Plan table for a given release line.
// Usage:
// node --harmony-temporal generateReleasePlan.cjs vxx

function printUsageAndExit() {
  console.error('Usage: node --harmony-temporal generateReleasePlan.cjs vxx');
  process.exit(1);
}

function normalizeReleaseLine(input) {
  if (!input) {
    return null;
  }

  const match = String(input).trim().match(/^v?(\d+)$/i);
  if (!match) {
    return null;
  }

  return 'v' + match[1];
}

function hasTemporal() {
  return typeof globalThis.Temporal !== 'undefined' &&
    typeof globalThis.Temporal.Now !== 'undefined' &&
    typeof globalThis.Temporal.PlainDate !== 'undefined';
}

function isoDateFromPlainDate(plainDate) {
  const month = String(plainDate.month).padStart(2, '0');
  const day = String(plainDate.day).padStart(2, '0');
  return plainDate.year + '-' + month + '-' + day;
}

function formatIsoDate(dateObj) {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function addWeeks(startDate, weeks) {
  if (hasTemporal()) {
    return startDate.add({ weeks: weeks });
  }

  const copy = new Date(startDate.getTime());
  copy.setUTCDate(copy.getUTCDate() + (weeks * 7));
  return copy;
}

function today() {
  if (hasTemporal()) {
    return globalThis.Temporal.Now.plainDateISO();
  }

  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function asIsoDate(value) {
  if (hasTemporal()) {
    return isoDateFromPlainDate(value);
  }

  return formatIsoDate(value);
}

function buildMilestones(releaseLine) {
  const start = today();
  const major = Number(releaseLine.slice(1));
  const oddEven = major % 2 === 0 ? 'even' : 'odd';

  return [
    {
      phase: 'Planning',
      weeksFromNow: 0,
      notes: 'Kickoff for ' + releaseLine + ' (' + oddEven + ' major line)'
    },
    {
      phase: 'Semver-Major Cutoff',
      weeksFromNow: 6,
      notes: 'Last call for breaking changes'
    },
    {
      phase: 'Feature Freeze',
      weeksFromNow: 12,
      notes: 'Only stabilization and bug fixes'
    },
    {
      phase: 'Beta',
      weeksFromNow: 14,
      notes: 'Broader testing and feedback window'
    },
    {
      phase: 'Release Candidate',
      weeksFromNow: 18,
      notes: 'Candidate build for final validation'
    },
    {
      phase: 'General Availability',
      weeksFromNow: 20,
      notes: 'Official ' + releaseLine + ' release'
    },
    {
      phase: 'Active LTS',
      weeksFromNow: 26,
      notes: oddEven === 'even' ? 'Eligible to transition to LTS track' : 'Usually remains Current (odd line)'
    },
    {
      phase: 'Maintenance',
      weeksFromNow: 56,
      notes: 'Security and critical fixes only'
    }
  ].map(function mapMilestone(milestone) {
    return {
      releaseLine: releaseLine,
      phase: milestone.phase,
      targetDate: asIsoDate(addWeeks(start, milestone.weeksFromNow)),
      notes: milestone.notes
    };
  });
}

function printMarkdownTable(rows) {
  console.log('| Release Line | Phase | Target Date | Notes |');
  console.log('| --- | --- | --- | --- |');

  rows.forEach(function printRow(row) {
    console.log('| ' + row.releaseLine + ' | ' + row.phase + ' | ' + row.targetDate + ' | ' + row.notes + ' |');
  });
}

function main() {
  const releaseLine = normalizeReleaseLine(process.argv[2]);
  if (!releaseLine) {
    printUsageAndExit();
  }

  const rows = buildMilestones(releaseLine);
  printMarkdownTable(rows);
}

main();
