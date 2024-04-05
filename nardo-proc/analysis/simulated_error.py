import sys


def main():
    print(
        "This is a simulated error message for testing error handling.", file=sys.stderr
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
