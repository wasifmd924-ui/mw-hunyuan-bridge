# MW Hunyuan Bridge — SketchUp Ruby API Import Reference
# Used by mwhunyuan_helper.py when launching SketchUp with -RubyStartup.
# Usage inside SketchUp Ruby Console:
#   MW_HunyuanBridge.import_dae("C:/path/to/model.dae")

module MW_HunyuanBridge
  def self.import_dae(dae_path)
    unless dae_path.is_a?(String) && dae_path.downcase.end_with?('.dae') && File.exist?(dae_path)
      UI.messagebox("MW Hunyuan Bridge: Invalid or missing .dae file.")
      return false
    end

    model = Sketchup.active_model
    status = model.import(dae_path, false)
    if status
      Sketchup.status_text = "MW Hunyuan Bridge: Imported #{File.basename(dae_path)}"
    else
      UI.messagebox("MW Hunyuan Bridge: SketchUp could not import #{File.basename(dae_path)}.")
    end
    status
  end
end

