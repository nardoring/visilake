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
    # print(f"Converted Parquet file to CSV: {csv_path}")


def convert_csv_to_parquet(csv_path, parquet_path):
    """Converts a CSV file to Parquet format."""
    df = pd.read_csv(csv_path)
    df.to_parquet(parquet_path, index=False)


def eda_analysis(directory, request_id):
    # Dear god what have I done...
    athenaFileLs = os.popen(f"awslocal s3 ls {directory}").read()
    # print(athenaFileLs)
    athenaFileName = athenaFileLs.split(" ")[-1]

    subprocess.call(f"mkdir -p {request_id}", shell=True)

    # print(f"{s3url}/{request_id}/{athenaFileName}")

    with urllib.request.urlopen(f"{s3url}/{request_id}/{athenaFileName}") as response:
        # Read the content
        content = gzip.decompress(response.read())

        json_strings = []
        for record in content.decode("utf-8").strip().rstrip("\n").split("\n"):
            # print(record)
            json_strings.append(json.loads(record))

        with open(f"./{request_id}.csv", mode="w") as csv_file:
            csv_writer = csv.DictWriter(csv_file, fieldnames=json_strings[0].keys())
            csv_writer.writeheader()
            for record in json_strings:
                csv_writer.writerow(record)

    csv_path = f"./{request_id}.csv"

    # subprocess.call(f"awslocal s3 cp {directory}{athenaFileName} ./{request_id}.gz", shell=True)
    # print(subprocess.call(f"chmod +r  ./{request_id}.parquet", shell=True))

    # print("EDA Analysis Starting")
    # print(f"Input path: {directory}")
    # print(f"Request id: {request_id}")

    # directory = f"../"

    # with gzip.open(f"./{request_id}/{request_id}.gz") as f:
    #     print(f.read())

    # directory = f"../infra/mockdata/metadata/{request_id}/"
    # try csv file first
    # csv_file = next(
    #     (file for file in os.listdir(directory) if file.endswith(".csv")), None
    # )

    # if csv_file:
    #     csv_path = os.path.join(directory, csv_file)
    #     # print(f"Found CSV file: {csv_path}")
    # else:
    #     # if no CSV file is found, look for a Parquet file and convert it to CSV
    #     parquet_file = next(
    #         (file for file in os.listdir(directory) if file.endswith(".parquet")),
    #         None,
    #     )
    #     if parquet_file:
    #         parquet_path = os.path.join(directory, parquet_file)
    #         csv_path = parquet_path.replace(".parquet", ".csv")
    #         convert_parquet_to_csv(parquet_path, csv_path)
    #     else:
    #         print("No suitable file found (.csv or .parquet) in the directory.")
    #         return

    # load the dataset from the found or converted CSV file
    df = pd.read_csv(csv_path, index_col=0)

    if "date local" in df.columns:
        df["date local"] = pd.to_datetime(df["date local"])

    profile = ProfileReport(
        df.head(1000),
        tsmode=True,
        sortby="date local",
        title=f"Profile for {request_id}",
        config_file="analysis/ydata-config.yaml",
    )

    directory = f"./outputs"

    # # Create a temporary file for the report
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

    convert_csv_to_parquet(csv_path, f"./outputs/{request_id}-data.parquet")

    # write to local disk for testing
    # profile_output_path = os.path.join(directory, f"{request_id}-eda.html")
    # profile.to_file(profile_output_path)
    # print(f"Profile report generated: {profile_output_path}")


# eda_analysis("s3://metadata/test-jobID-781/","test-jobID-781")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python eda_analysis.py <directory> <request_id>")
        sys.exit(1)

    directory = sys.argv[1]
    request_id = sys.argv[2]
    eda_analysis(directory, request_id)
