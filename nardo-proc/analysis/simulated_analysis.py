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
        with open(f"{directory}{request_id}-data.csv", "w") as file:
            file.write(f"Processed data based on input from {directory}\n")
            file.write(f"This is a simulated output for {request_id}.\n")
        print("Simulated processing done.", file=sys.stderr)

        with tempfile.NamedTemporaryFile(
            delete=False,
            mode="w",
            suffix=".csv",
            dir=directory,
            prefix=f"{request_id}-temp-",
        ) as tmpfile:
            tmpfile.write(f"Temporary data based on input from {directory}\n")
            tmpfile.write(f"This is a temporary simulated output for {request_id}.\n")
            # Print the path of the temporary file to stdout
            print(tmpfile.name)

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
