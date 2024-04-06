import sys
import os
import tempfile


def simulate_job(directory, request_id):
    print("Simulating job run with the following metadata:", file=sys.stderr)
    print(f"Path: {directory}", file=sys.stderr)
    print(f"Request id: {request_id}", file=sys.stderr)

    directory = f"../infra/mockdata/metadata/{request_id}/"
    if not os.path.exists(directory):
        os.makedirs(directory)

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            mode="w",
            suffix=".parquet",
            dir=directory,
            prefix=f"{request_id}-data-",
        ) as tmpfile:
            tmpfile.write(f"Temporary data based on input from {directory}\n")
            tmpfile.write(f"This is a temporary simulated output for {request_id}.\n")
            # Print the path of the temporary file to stdout
            print(tmpfile.name)
            print("Simulated processing done.", file=sys.stderr)

    except Exception as e:
        print(f"Error writing the file: {e}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            "Usage: python simulated_analysis.py <directory> <request_id>",
            file=sys.stderr,
        )
        sys.exit(1)

    directory = sys.argv[1]
    request_id = sys.argv[2]
    simulate_job(directory, request_id)
