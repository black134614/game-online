"""Copy the explicitly labelled aura concept demo, without writing any runtime assets."""
from pathlib import Path
import json
import shutil

def sync_aura(root):
    source=root/'design_export/gear-aura-demo-20261113'
    target=root/'game-home/public/assets/aura'
    target.mkdir(parents=True,exist_ok=True)
    points=(source/'actor-data.js').read_text('utf-8').removeprefix('window.WEAPON_POINTS=').strip().removesuffix(';')
    points=json.loads(points)
    (target/'weapon-points.json').write_text(json.dumps(points,separators=(',',':')),'utf-8')
    shutil.copytree(source/'actors',target/'actors',dirs_exist_ok=True)
    shutil.copy2(source/'preview-aura.gif',target/'preview.gif')
    shutil.copy2(source/'capture-08.png',target/'poster.png')
    shutil.copy2(source/'sources.json',target/'sources.json')
    print(f'Imported aura concept: {len(points)} weapon masks; preview only, not installed in client.')

if __name__=='__main__':sync_aura(Path(__file__).resolve().parents[2])
