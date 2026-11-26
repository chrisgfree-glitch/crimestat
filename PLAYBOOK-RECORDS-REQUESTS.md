# Public records request playbook

Repeatable steps for asking a Washington police agency to release block-level crime incident data that CrimeStat can lawfully map. This is a how-to for a requester to use themselves. CrimeStat does not file, sign, or submit requests.

No agency is contacted from this document. Drafts stay drafts until the requester sends them.

## 1. Identify the agency and its records portal

1. Confirm which agency actually polices the city (city police, a contracted sheriff, or both).
2. Use that agency’s official public records page or portal, not a third-party crime map.
3. Note the records email, web form, or mailing address, plus any required form or reference number.
4. If the city and the sheriff both publish data, say clearly which agency’s records you want, so sheriff rows are not treated as city-police incidents.

## 2. What to ask for

Ask for a machine-readable extract of reported crime incidents (CSV or JSON), not a narrative case file. Request only:

- Incident or report date and time
- Offense or NIBRS code and a plain-language offense type
- Location generalized to the 100-block (for example, “3100 block of A Street”), or official coordinates already blurred to the 100-block
- A unique report or incident number, if it does not identify a person
- City, beat, or reporting district, if those fields exist

Do not ask for, and ask the agency to omit:

- Victim, suspect, or witness names
- Home addresses more precise than the 100-block, unless the agency’s official public feed already publishes them and you have a separate, documented reason to use that precision
- Phone numbers, dates of birth, or other personal identifiers
- Juvenile-identifying information
- Fields the agency marks confidential, or that are exempt under the Public Records Act

Also ask the agency to say how often the extract is updated and what license or reuse terms apply.

## 3. Legal citation

In Washington, cite the Public Records Act:

> This is a request for public records under the Washington Public Records Act, chapter 42.56 RCW.

Keep the request reasonably specific, as RCW 42.56.080 requires, and ask for an estimate if the agency needs more time. Agencies may withhold or redact exempt information; you can still ask them to release the remaining non-exempt fields, including a 100-block location.

This playbook is not legal advice.

## 4. Follow-up timeline

- Note the date the request was submitted and any tracking number.
- Washington agencies should respond promptly. If there is no acknowledgment in about five business days, send a short follow-up asking for the status and a date you can expect a decision or estimate.
- If the agency asks to clarify, reply with the field list above.
- If you receive a denial or a heavy redaction, ask which exemption was applied to the location or offense fields and whether a 100-block version can be released.
- Keep a copy of the request, the response, and any files received.

## 5. Ask for an ongoing open feed

In the same request, or as a follow-up after the first extract, ask the agency to publish the same non-identifying fields on an official open-data portal or documented API, updated on a regular schedule (daily or at least weekly), with stated reuse terms. That is how later CrimeStat snapshots can stay current without a new records request each time.

## 6. Using the data on CrimeStat

Only official agency files, or an official open feed, should be used. Do not copy third-party crime maps. Do not invent locations. Rape / sexual assault, domestic violence, and stalking stay area totals, never pins or addresses. Juvenile-related records stay off the map unless the agency already publishes a non-identifying, reusable public feed and the usual sensitive-type rules still apply.

## Short request template

```
Subject: Public records request — block-level crime incidents (RCW 42.56)

This is a request for public records under the Washington Public Records Act, chapter 42.56 RCW.

Please provide a machine-readable copy (CSV or JSON) of reported crime incidents for [agency / city], for [date range, or “the most recent 12 months, and ongoing if available], with these fields only:

- incident or report date and time
- offense or NIBRS code and offense type
- location at the 100-block, or official coordinates already blurred to the 100-block
- incident or report number, if it does not identify a person
- city, beat, or reporting district, if available

Please omit names, precise residential addresses, and other personal identifiers. Please also omit or redact any fields you determine are exempt, and release the remaining non-exempt fields.

If a one-time extract is all that is available now, I also request that [agency] consider publishing the same non-identifying fields as a regularly updated open data feed, with stated reuse terms.

If this request needs clarification or a time/cost estimate, please let me know.
```

Replace the bracketed placeholders before sending. Do not include this playbook’s author information in the request.
