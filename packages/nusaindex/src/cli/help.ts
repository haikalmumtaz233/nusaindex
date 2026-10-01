export const HELP = `Usage: nusaindex <command> [arguments] [options]

Validate and parse
  nusaindex <nik|npwp|phone|plate|nip|nisn> <value>

Mask
  nusaindex mask <nik|npwp|phone|nip|nisn|account|text> <value>

Rupiah
  nusaindex rupiah format <amount> [--decimals] [--no-symbol]
  nusaindex rupiah parse <text>
  nusaindex rupiah terbilang <amount>

Reference data
  nusaindex region get <code>
  nusaindex region resolve <code>    Follow codes renumbered by region splits
  nusaindex region children [code]
  nusaindex region search <query> [--level <level>] [--limit <n>]
  nusaindex region nik <nik>
  nusaindex holiday <year>
  nusaindex bank <code|bic|list>
  nusaindex workday is <date>
  nusaindex workday add <date> <days>
  nusaindex workday count <from> <to>
    --weekend <days>     Weekend days, 0 = Sunday (default 6,0)
    --leave-workday      Count collective leave as working days

Test data (for tests only, numbers may belong to real people)
  nusaindex fake <nik|npwp|phone|nip|nisn|plate> [--seed <n>] [--count <n>]
    --region <code>      NIK region or plate code
    --birth-date <date>  NIK and NIP birth date (YYYY-MM-DD)
    --sex <male|female>  NIK and NIP sex

Batch (validate, mask and rupiah)
  --stdin                Read one value per line from standard input
  --csv --column <c>     Read CSV from standard input and process column <c>

Options
  --json                 Print JSON
  -h, --help             Show this help
  -v, --version          Show the version

Values typed as arguments can end up in your shell history; prefer --stdin for real data.
Valid means well-formed: nusaindex cannot tell whether a number is real or who owns it.
Unofficial. Not affiliated with any Indonesian government agency.`;
