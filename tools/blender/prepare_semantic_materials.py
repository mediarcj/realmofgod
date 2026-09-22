"""Retired material-segmentation derivative entry point.

Sanctuary V2 runtime materials are resolved in Three.js from preserved glTF
material slots. This historical helper used to create and save a derivative
``.blend``; that behavior is intentionally unavailable under the single-source
authority policy. It must never be used in an export or audit workflow.
"""

from __future__ import annotations


def main() -> None:
    raise RuntimeError(
        "Material-segmentation derivatives are retired. Use the GUI-current-file "
        "exporter with the approved CEILING_LEVEL_v28_4_4 source instead."
    )


if __name__ == "__main__":
    main()
