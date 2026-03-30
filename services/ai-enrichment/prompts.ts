import { getTaxonomyPromptSnippet } from './taxonomy';

function jsonOnlyFooter(): string {
  return [
    'Return valid JSON only. No markdown, no code fences, no commentary.',
    'Use null for unknown scalar fields and empty arrays [] when a list has no supported items.',
    'Keep confidence between 0 and 1.',
    'Prefer lowercase slug-style strings for normalized lists (e.g. cnc_milling, iso_9001).',
  ].join('\n');
}

export function buildSupplierProfilePrompts(inputPayload: Record<string, unknown>): {
  system: string;
  user: string;
} {
  const system = [
    'You are a manufacturing taxonomy normalizer for Marcan (mar-can.ca), a Canadian manufacturing marketplace.',
    'Convert supplier/manufacturer profile data into ONE strict JSON object matching the expected schema.',
    'Extract only information clearly supported by the input. If unsure, use null or empty arrays.',
    'Do not invent certifications, processes, materials, industries, or capacities.',
    'Normalize Canadian provinces to two-letter codes when possible (e.g. Ontario → ON).',
    'Separate explicit_source_terms (verbatim or clearly stated) from inferred_terms (lightly implied).',
    getTaxonomyPromptSnippet(),
    jsonOnlyFooter(),
  ].join('\n');

  const user = [
    'Normalize this supplier profile JSON into the supplier_profile schema:',
    JSON.stringify(inputPayload, null, 2),
  ].join('\n\n');

  return { system, user };
}

export function buildBuyerProfilePrompts(inputPayload: Record<string, unknown>): { system: string; user: string } {
  const system = [
    'You are a buyer-profile normalizer for Marcan (mar-can.ca), a Canadian manufacturing marketplace.',
    'This JSON describes a buyer ACCOUNT profile, not a specific sourcing request.',
    'Do not invent procurement needs beyond what the input supports.',
    'Extract organization/buying context only when clearly supported.',
    'Normalize Canadian provinces to two-letter codes when possible.',
    jsonOnlyFooter(),
  ].join('\n');

  const user = ['Normalize this buyer profile JSON into the buyer_profile schema:', JSON.stringify(inputPayload, null, 2)].join(
    '\n\n'
  );

  return { system, user };
}

export function buildStorefrontProfilePrompts(inputPayload: Record<string, unknown>): {
  system: string;
  user: string;
} {
  const system = [
    'You are a storefront seller-profile normalizer for Marcan (mar-can.ca).',
    'This JSON describes a storefront ACCOUNT profile, not individual inventory listings.',
    'Do not invent inventory, equipment, or listings.',
    'Infer only broad seller type or likely listing categories when strongly supported.',
    'Normalize Canadian provinces to two-letter codes when possible.',
    jsonOnlyFooter(),
  ].join('\n');

  const user = [
    'Normalize this storefront profile JSON into the storefront_profile schema:',
    JSON.stringify(inputPayload, null, 2),
  ].join('\n\n');

  return { system, user };
}

export function buildSourcingRequestPrompts(inputPayload: Record<string, unknown>): {
  system: string;
  user: string;
} {
  const system = [
    'You are a manufacturing sourcing-request normalizer for Marcan (mar-can.ca).',
    'Convert the request into strict JSON suitable for matching suppliers.',
    'Normalize materials, processes, industries, and location hints.',
    'Do not invent specifications, quantities, or deadlines not supported by the input.',
    'Extract urgency or commercial hints only when clearly stated.',
    getTaxonomyPromptSnippet(),
    jsonOnlyFooter(),
  ].join('\n');

  const user = [
    'Normalize this sourcing request JSON into the sourcing_request schema:',
    JSON.stringify(inputPayload, null, 2),
  ].join('\n\n');

  return { system, user };
}

export function buildStorefrontListingPrompts(inputPayload: Record<string, unknown>): {
  system: string;
  user: string;
} {
  const system = [
    'You are an industrial listing normalizer for Marcan (mar-can.ca).',
    'Classify listing_class as one of: inventory, equipment, machine_time, space, service, other.',
    'Normalize equipment, material, and service wording using concise slug-style tokens where possible.',
    'Do not invent specifications, dimensions, or condition beyond the input.',
    jsonOnlyFooter(),
  ].join('\n');

  const user = [
    'Normalize this storefront listing JSON into the storefront_listing schema:',
    JSON.stringify(inputPayload, null, 2),
  ].join('\n\n');

  return { system, user };
}
