# NanoGPT Tokenizer Notebook

This repository contains a single notebook, `nanogpt.ipynb`, that walks through several tokenizer implementations inspired by nanoGPT and GPT-2.

The notebook includes:

- A minimal byte-pair encoding (BPE) tokenizer built from scratch
- A GPT-2-style tokenizer with regex pre-tokenization
- A GPT-2 tokenizer loader that uses the official `encoder.json` and `vocab.bpe` files
- Round-trip tests and comparisons against `tiktoken`

## What It Demonstrates

The notebook is structured as a learning and validation workflow:

1. Train a simple BPE tokenizer on sample text
2. Verify `decode(encode(x)) == x` on ASCII and sample strings
3. Implement GPT-2 style pre-tokenization and BPE merge logic
4. Download GPT-2 vocabulary files and test a compatible tokenizer implementation
5. Compare outputs against `tiktoken` for several example strings

## Requirements

The notebook is written for Python 3.12 and uses:

- `numpy`
- `pandas`
- `regex`
- `tiktoken`

The notebook also downloads the GPT-2 vocabulary files during execution:

- `encoder.json`
- `vocab.bpe`

## Running the Notebook

Open `nanogpt.ipynb` in VS Code or Jupyter and run the cells from top to bottom.

If you want to reproduce the tokenizer comparison locally, make sure the notebook environment has `regex`, `pandas`, and `tiktoken` installed.

## Notes

- The notebook contains exploratory code and validation cells rather than a packaged Python module.
- The GPT-2 tokenizer section is intended to match the behavior of the official GPT-2 encoding for the included examples.
- The notebook is self-contained and does not require any project-specific configuration beyond the Python dependencies above.

## Learning Log

- 2026-04-29: Learned about attention and thinking models today.
