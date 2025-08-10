import json
import argparse
import os
from src.main import app


def generate_openapi_spec(output_dir: str):
    """
    Generates a static OpenAPI specification for client generation and saves it to the specified directory.
    """
    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    openapi_schema = app.openapi()

    # Define the full paths for the output files
    json_path = os.path.join(output_dir, "openapi.json")

    # Save as JSON
    with open(json_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"OpenAPI spec generated as {json_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate OpenAPI spec for a FastAPI application."
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=str,
        default="./",  # Default to current directory
        help="Directory where the OpenAPI spec files will be saved.",
    )

    args = parser.parse_args()
    generate_openapi_spec(args.output_dir)
