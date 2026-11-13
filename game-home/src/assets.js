export const assetUrl = (path) =>
  import.meta.env.BASE_URL + path.replace(/^(\.\.\/)+/, "").replace(/^\//, "");
export const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

let skillData;
export function loadSkillData() {
  if (!skillData) {
    skillData = Promise.all(
      ["skills.json", "replay.json"].map(async (path) => {
        const response = await fetch(assetUrl(path));
        if (!response.ok) throw new Error("Không tải được dữ liệu kỹ năng.");
        return response.json();
      }),
    ).catch((error) => {
      skillData = undefined;
      throw error;
    });
  }
  return skillData;
}
