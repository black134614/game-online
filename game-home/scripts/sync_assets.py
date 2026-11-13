"""Import the reviewed local showcase into the React site's self-contained public folder.
Run from the repository root. No DB connection or runtime game writes.
"""
from pathlib import Path
import json
import shutil

root=Path(__file__).resolve().parents[2]
source=root/'design_export/linh-van-showcase-20261113'
dist=source/'dist'
public=root/'game-home/public'
public.mkdir(parents=True,exist_ok=True)
def read_js(path,prefix):
    text=path.read_text('utf-8')
    if not text.startswith(prefix): raise ValueError('Unknown data format: '+str(path))
    return json.loads(text[len(prefix):].strip().removesuffix(';'))
catalog=read_js(dist/'catalog.js','window.GAME_DATA = ')
skills=read_js(dist/'current-skills/data.js','window.CURRENT_SKILLS = ')
replay=read_js(dist/'current-skills/mob-demo-data.js','window.INSTALLED_MOB_DEMO = ')
if any(skill.get('trainingAtlas') for skill in skills['skills']):
    raise ValueError('The withdrawn wave/claw animation is still present in the source export.')
references={r['asset'] for r in json.loads((source/'asset-sources.json').read_text('utf-8'))}
references.update(path[3:] for frames in replay['actors'].values() for path in frames)
references.update(path[3:] for frames in replay['trails'].values() for path in frames)
references.update(path[3:] for mob in replay['mobs'] for path in mob['frames'])
for path in sorted(references):
    origin=(dist/path).resolve()
    if not origin.is_relative_to(dist.resolve()) or not origin.is_file(): raise FileNotFoundError(path)
    target=public/path
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(origin,target)
for name,value in [('catalog',catalog),('skills',skills),('replay',replay)]:
    (public/f'{name}.json').write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')),'utf-8')
print(f'Imported {len(catalog["items"])} resources, {len(skills["skills"])} skills and {len(references)} files; no withdrawn trails.')
