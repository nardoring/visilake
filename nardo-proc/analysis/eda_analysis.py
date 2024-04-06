"""
Time-series profiling for VisiLake
"""

import sys
import os
import pandas as pd
import tempfile

from ydata_profiling import ProfileReport


def convert_parquet_to_csv(parquet_path, csv_path):
    """Converts a Parquet file to CSV format."""
    df = pd.read_parquet(parquet_path)
    df.to_csv(csv_path, index=False)
    # print(f"Converted Parquet file to CSV: {csv_path}")


def eda_analysis(directory, request_id):
    # print("EDA Analysis Starting")
    # print(f"Input path: {directory}")
    # print(f"Request id: {request_id}")

    directory = f"../infra/mockdata/metadata/{request_id}/"
    # try csv file first
    csv_file = next(
        (file for file in os.listdir(directory) if file.endswith(".csv")), None
    )

    if csv_file:
        csv_path = os.path.join(directory, csv_file)
        # print(f"Found CSV file: {csv_path}")
    else:
        # if no CSV file is found, look for a Parquet file and convert it to CSV
        parquet_file = next(
            (file for file in os.listdir(directory) if file.endswith(".parquet")),
            None,
        )
        if parquet_file:
            parquet_path = os.path.join(directory, parquet_file)
            csv_path = parquet_path.replace(".parquet", ".csv")
            convert_parquet_to_csv(parquet_path, csv_path)
        else:
            print("No suitable file found (.csv or .parquet) in the directory.")
            return

    # load the dataset from the found or converted CSV file
    df = pd.read_csv(csv_path, index_col=0)

    if "Date Local" in df.columns:
        df["Date Local"] = pd.to_datetime(df["Date Local"])

    profile = ProfileReport(
        df.head(10),
        tsmode=True,
        sortby="Date Local",
        title=f"Profile for {request_id}",
        config_file="analysis/ydata-config.yaml",
    )

    # Create a temporary file for the report
    with tempfile.NamedTemporaryFile(
        delete=False,
        mode="w",
        suffix=".html",
        dir=directory,
        encoding="utf-8",
        prefix=f"{request_id}-eda-",
    ) as tmpfile:
        profile.to_file(tmpfile.name)
        # print(f"Profile report generated: {tmpfile.name}", file=sys.stderr)
        print(tmpfile.name)

    # write to local disk for testing
    # profile_output_path = os.path.join(directory, f"{request_id}-eda.html")
    # profile.to_file(profile_output_path)
    # print(f"Profile report generated: {profile_output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python eda_analysis.py <directory> <request_id>")
        sys.exit(1)

    directory = sys.argv[1]
    request_id = sys.argv[2]
    eda_analysis(directory, request_id)
