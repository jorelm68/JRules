# Knowledge map

<!-- The project's knowledge graph. Read this before searching the code; jump to the files named here.
     Nodes are things (modules, stores, services, concepts); edges say how they connect.
     Edited only in the final PR of a task. Terse: one line per fact.
     Only the Index is loaded each session; nodes are fetched with `kg.mjs query <id>` — keep the Index to one line
     per node and in sync with the ### sections (`kg.mjs check` verifies). -->

## Index
- [[{{node-id}}]] — {{what it is, a few words}} · `{{main path}}`

## Nodes

### {{node-id}} — {{what it is}}
- **Files:** `{{path/}}`
- **Purpose:** {{one line}}
- **Edges:** depends-on → [[{{other-node}}]] · used-by → [[{{other-node}}]] · writes-to → [[{{store}}]]
- **Entry points:** `{{path:line}}` {{e.g. main handler, public API}}

## Flows
<!-- Key end-to-end paths through the nodes, e.g. "request → api → service → db". -->
- {{flow name}}: [[a]] → [[b]] → [[c]]

## Decisions
<!-- Why things are the way they are; link the PR or doc. -->
- {{decision}} — {{reason}} ({{PR link}})
