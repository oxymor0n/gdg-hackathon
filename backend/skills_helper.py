import os
import json
import subprocess
import tempfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Absolute path to the science-skills repository
SKILLS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "science-skills"))
import shutil
UV_PATH = shutil.which("uv") or os.path.expanduser("~/.local/bin/uv")

def run_cli_command(args, output_file=None, capture_stdout=False):
    """Runs a science-skills CLI command using uv."""
    cmd = [UV_PATH, "run"] + args
    logger.info(f"Running command: {' '.join(cmd)}")
    
    try:
        if capture_stdout:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            if output_file:
                with open(output_file, "w") as f:
                    f.write(result.stdout)
                return json.loads(result.stdout)
            return json.loads(result.stdout)
        else:
            subprocess.run(cmd, check=True, capture_output=True)
            if output_file and os.path.exists(output_file):
                with open(output_file, "r") as f:
                    return json.load(f)
            return {"status": "success"}
    except subprocess.CalledProcessError as e:
        logger.error(f"CLI command failed: {e.stderr}")
        return {"error": e.stderr or str(e)}
    except Exception as e:
        logger.error(f"Error running CLI command: {str(e)}")
        return {"error": str(e)}

# --- PubChem Skills ---
def pubchem_resolve(name):
    """Resolves a chemical name to compound identifiers."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "pubchem_database", "scripts", "pubchem_api.py")
        args = [script, "resolve", "--name", name, "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def pubchem_properties(cid):
    """Retrieves physical and chemical properties for a given CID."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "pubchem_database", "scripts", "pubchem_api.py")
        args = [script, "properties", "--cid", str(cid), "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def pubchem_safety(cid):
    """Retrieves safety and hazard information (GHS) for a given CID."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "pubchem_database", "scripts", "pubchem_api.py")
        args = [script, "safety", "--cid", str(cid), "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def pubchem_pharmacology(cid):
    """Retrieves FDA pharmacology and therapeutic info for a given CID."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "pubchem_database", "scripts", "pubchem_api.py")
        args = [script, "pharmacology", "--cid", str(cid), "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

# --- ChEMBL Skills ---
def chembl_search_molecule(name):
    """Searches ChEMBL for molecule details by name."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "chembl_database", "scripts", "chembl_api.py")
        args = [script, "molecule", "--search", name, "--limit", "1", "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

def chembl_mechanisms(molecule_id):
    """Retrieves molecular mechanisms of action for a ChEMBL ID."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "chembl_database", "scripts", "chembl_api.py")
        args = [script, "mechanism", "--filter", f"molecule_chembl_id={molecule_id}", "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

# --- OpenAlex (Literature Search) Skill ---
def openalex_search_synthesis(name):
    """Searches OpenAlex for papers on synthesis routes."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "literature_search_openalex", "scripts", "openalex_cli.py")
        # Direct redirect style because openalex CLI writes to stdout in some filters
        args = [script, "filter", "works", "--search", f"{name} synthesis", "--per-page", "5"]
        return run_cli_command(args, output_file=tmp_name, capture_stdout=True)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

# --- openFDA Skill ---
def openfda_search_label(name):
    """Searches openFDA for product label details."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_name = tmp.name
    try:
        script = os.path.join(SKILLS_DIR, "skills", "openfda_database", "scripts", "openfda_query.py")
        args = [script, "search", "--category", "drug", "--endpoint", "label", 
                "--search", f"openfda.generic_name:{name}", "--limit", "1", "--output", tmp_name]
        return run_cli_command(args, output_file=tmp_name)
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)
