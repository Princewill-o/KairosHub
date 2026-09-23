using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
namespace Kairos.Editor {
 public static class KairosBuild {
  [MenuItem("Kairos/Prepare playable scene")]
  public static void Prepare(){
   string root=Path.GetFullPath(Path.Combine(Application.dataPath,"../../.."));
   string destination="Assets/Resources/Kairos";Directory.CreateDirectory(destination);
   foreach(string name in new[]{"walk.png","creatures.png"})File.Copy(Path.Combine(root,"public/assets/arcade",name),Path.Combine(destination,name),true);
   AssetDatabase.Refresh();
   foreach(string name in new[]{"walk.png","creatures.png"}){
    var importer=(TextureImporter)AssetImporter.GetAtPath(destination+"/"+name);
    importer.textureType=TextureImporterType.Default;importer.alphaIsTransparency=true;importer.mipmapEnabled=false;importer.textureCompression=TextureImporterCompression.Uncompressed;importer.SaveAndReimport();
   }
   Directory.CreateDirectory("Assets/Scenes");
   var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
   new GameObject("Kairos").AddComponent<KairosRuntime>();
   EditorSceneManager.SaveScene(scene,"Assets/Scenes/Kairos.unity");
   EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene("Assets/Scenes/Kairos.unity",true)};
   PlayerSettings.companyName="Kairos";PlayerSettings.productName="Kairos Adventures";
   // Runtime uses the legacy Input API plus touch controls drawn by IMGUI.
   var settings=new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);
   var input=settings.FindProperty("activeInputHandler");if(input!=null){input.intValue=0;settings.ApplyModifiedPropertiesWithoutUndo();}
   AssetDatabase.SaveAssets();
  }
  [MenuItem("Kairos/Build Web for Hub")]
  public static void Web(){
   Prepare();PlayerSettings.WebGL.template="PROJECT:Kairos";PlayerSettings.WebGL.compressionFormat=WebGLCompressionFormat.Disabled;
   string root=Path.GetFullPath(Path.Combine(Application.dataPath,"../../.."));
   string output=Path.Combine(root,"unity-build");
   string marker=Path.Combine(output,"build.json");if(File.Exists(marker))File.Delete(marker);
   Build(output,BuildTarget.WebGL);
   File.WriteAllText(Path.Combine(output,"build.json"),"{\"schema\":1,\"engine\":\"unity\",\"entry\":\"index.html\"}");
  }
  [MenuItem("Kairos/Build native LAN host (macOS)")]
  public static void Mac(){Prepare();Build("Builds/Kairos.app",BuildTarget.StandaloneOSX);}
  [MenuItem("Kairos/Build native LAN host (Windows)")]
  public static void Windows(){Prepare();Build("Builds/Windows/Kairos.exe",BuildTarget.StandaloneWindows64);}
  static void Build(string output,BuildTarget target){
   var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{"Assets/Scenes/Kairos.unity"},locationPathName=output,target=target});
   if(report.summary.result!=BuildResult.Succeeded)throw new Exception("Kairos build failed: "+report.summary.result);
  }
 }
}
