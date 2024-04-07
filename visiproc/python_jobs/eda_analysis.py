"""
Time-series profiling for VisiLake
"""

import sys
import os
import pandas as pd
import tempfile
import subprocess
import gzip
import urllib.request
import json
import csv

from ydata_profiling import ProfileReport

s3url = "http://s3.us-east-1.localhost.localstack.cloud:4566/metadata"


def convert_parquet_to_csv(parquet_path, csv_path):
    """Converts a Parquet file to CSV format."""
    df = pd.read_parquet(parquet_path)
    df.to_csv(csv_path, index=False)


def convert_csv_to_parquet(csv_path, parquet_path):
    """Converts a CSV file to Parquet format."""
    df = pd.read_csv(csv_path)
    df.to_parquet(parquet_path, index=False)


def eda_analysis(directory, request_id):
    athenaFileLs = os.popen(f"awslocal s3 ls {directory}").read()
    athenaFileName = athenaFileLs.split(" ")[-1]
    subprocess.call(f"mkdir -p outputs/{request_id}", shell=True)

    with urllib.request.urlopen(f"{s3url}/{request_id}/{athenaFileName}") as response:
        content = gzip.decompress(response.read())

        json_strings = []
        for record in content.decode("utf-8").strip().rstrip("\n").split("\n"):
            json_strings.append(json.loads(record))

        with open(f"./outputs/{request_id}/{request_id}.csv", mode="w") as csv_file:
            csv_writer = csv.DictWriter(csv_file, fieldnames=json_strings[0].keys())
            csv_writer.writeheader()
            for record in json_strings:
                csv_writer.writerow(record)

    csv_path = f"./outputs/{request_id}/{request_id}.csv"

    # load the dataset from the found or converted CSV file
    df = pd.read_csv(csv_path, index_col=0)

    if "date local" in df.columns:
        df["date local"] = pd.to_datetime(df["date local"])

    profile = ProfileReport(
        df.head(1000),
        tsmode=True,
        sortby="date local",
        title=f"Profile for {request_id}",
        config_file="python_jobs/ydata-config.yaml",
    )

    directory = f"./outputs/{request_id}"

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
        print(
            tmpfile.name
        )  ## job_queue.rs reads stdout to get the location of the eda report

    convert_csv_to_parquet(
        csv_path, f"./outputs/{request_id}/{request_id}-data.parquet"
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python eda_analysis.py <directory> <request_id>")
        sys.exit(1)

    directory = sys.argv[1]
    request_id = sys.argv[2]
    eda_analysis(directory, request_id)
