#!/usr/bin/env python
import subprocess
import sys
import os


def run_command(command):
    print(f"\n▶️ Running: {' '.join(command)}")
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {' '.join(command)}\n{e}")


def main():
    if len(sys.argv) != 2:
        print("Usage: python formatter.py <target_folder>")
        sys.exit(1)

    target = sys.argv[1]
    if not os.path.isdir(target):
        print(f"❌ '{target}' is not a valid directory.")
        sys.exit(1)

    # 1. Format with black
    run_command(["black", target])

    # 2. Format with autopep8
    run_command(
        [
            "autopep8",
            "--in-place",
            "--aggressive",
            "--aggressive",
            "--recursive",
            target,
        ]
    )

    # 3. Fix lint issues with ruff
    run_command(["ruff", "check", target, "--fix"])

    # 4. Show remaining issues with flake8
    run_command(["flake8", target])


if __name__ == "__main__":
    main()
