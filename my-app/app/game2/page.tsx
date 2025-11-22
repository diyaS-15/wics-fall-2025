export default function Game2() {
    return (
      <div className="flex items-center justify-center h-screen">
    <iframe
      src="game2/index.html"
      width="800"
      height="600"
      style={{ border: "none" }}
      title="Godot Game"
      allowFullScreen
    />
    </div>
  );
}