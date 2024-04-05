import sys


def simulate_job(input_path, output_path):
    print("Simulating job run with the following paths:")
    print(f"Input path: {input_path}")
    print(f"Output path: {output_path}")

    with open("test-result.csv", "w") as file:
        file.write(f"Processed data based on input from {input_path}\n")
        file.write("This is a simulated output.\n")

    print("Processing done.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python simulated_analysis.py <input_path> <output_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    simulate_job(input_path, output_path)
