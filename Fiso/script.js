//
//  FisoJS a lib to save and open
//  files with JS in Browser.
//  
//  License: WL
//  WL: Without license.
//


var FISOFile = function(handle,isRoot){
    var self = this;
    self.handle = handle;

    self.container = {};
    self.path = [];

    if(isRoot){
        self.container = "root";
        self.path = ["root"];
    }

    self.getName = function(){
        return self.handle.name;
    }
    self.getType = function(){
        return "file";
    }
    self.getSize = function(){
        return self.handle.size;
    }
    self.getContainer = function(){
        return self.container;
    }
    self.getPath = function(){
        return self.path;
    }
    self.getExtensions = function(){
        return self.getName().split(".");
    }
    self.read = function(){
        return new Promise(function(resolve,reject){
            var fileReader = new FileReader();

            fileReader.onload = function(){
                resolve(fileReader.result);
            }

            fileReader.readAsArrayBuffer(self.handle);
        })
    }
}

var FISOFolder = function(FisaObject,name,isRoot){
    var self = this;
    self.entries = [];

    self.container = {};
    self.path = [];

    if(isRoot){
        self.container = "root";
        self.path = ["root"];
    }
    
    var FisaPath = FisaObject;

    self.getName = function(){
        return name;
    }
    self.getType = function(){
        return "folder";
    }
    self.getSize = async function(){
        return FisaPath.measureFolder(self);
    }
    self.getContainer = function(){
        return self.container;
    }
    self.getPath = function(){
        return self.path;
    }
}

var Fiso = function(){
    var self = this;

    self.saveFile = function(name,data){
        var blob = new Blob([data],{type:"application/octet-stream"});

        var url = window.URL.createObjectURL(blob);

        var link = document.createElement("a");

        link.style.display = "none";
        link.download = name;
        link.href = url;

        document.body.appendChild(link);

        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    }
    self.openFile = function(options){
        return new Promise(function(resolve,reject){
            var accept = "";
            var multiple = false;

            if(options !== undefined){
                options.accept !== undefined ? accept = options.accept : null;
                options.multiple !== undefined ? multiple = options.multiple : null;
            }

            var input = document.createElement("input");

            input.type = "file";
            input.accept = accept;
            input.multiple = multiple;

            input.style.display = "none";

            document.body.appendChild(input);

            input.click();

            input.onchange = function(){
                var files = [];

                for(var fileIndex in input.files){
                    if(typeof(input.files[fileIndex]) === "object"){
                        files.push(new FISOFile(input.files[fileIndex],false));
                    }
                }

                if(files.length === 1){
                    files = files[0];
                }

                resolve(files,true);
            }
        })
    }
    self.openFolder = function(){
        return new Promise(function(resolve,reject){
            var input = document.createElement("input");

            input.type = "file";
            input.webkitdirectory = true;

            input.style.display = "none";

            document.body.appendChild(input);

            input.click();

            input.onchange = function(){
                var folders = [];

                function addFile(array,file,isRoot){
                    array.push(new FISOFile(file,isRoot));
                }

                function hasFolder(array,name){
                    for(var folder of array){
                        if(folder.getType() !== "folder"){
                            continue;
                        }

                        if(folder.getName() === name){
                            return true;
                        }
                    }

                    return false;
                }

                function getFolder(array,name){
                    for(var folderIndex in array){
                        var folder = array[folderIndex];

                        if(folder.getType() !== "folder"){
                            continue;
                        }

                        if(folder.getName() === name){
                            return folder;
                        }
                    }
                }

                function addFolder(array,name,isRoot){
                    array.push(new FISOFolder(self,name,isRoot));
                }

                function scan(array,file,path,folderIsRoot){
                    if(path.length <= 0){
                        addFile(array,file,false);
                    }else{
                        if(hasFolder(array,path[0])){
                            scan(getFolder(array,path[0]).entries,file,path.slice(1),false);
                        }else{
                            addFolder(array,path[0],folderIsRoot);
                            scan(array[array.length - 1].entries,file,path.slice(1),false);
                        }
                    }
                }

                for(var file of input.files){
                    var path = file.webkitRelativePath.split("/").slice(0,-1);

                    if(path.length === 0){
                        addFile(folders,file,true);
                    }else{
                        scan(folders,file,path,true);
                    }
                }

                self.fillFolder(folders)
                resolve(folders);
            }
        })
    }
    self.fillFolder = function(folder){
        function scan(container,array){
            for(var item of array){
                if(item.container === "root" || item.path === ["root"]){
                    if(item.getType() === "folder"){
                        scan(item,item.entries);
                    }
                    return;
                }else{
                    item.container = container;
                    item.path = [...container.path,container];

                    if(item.getType() === "folder"){
                        scan(item,item.entries);
                    }
                }
            }
        }

        scan(null,Array.isArray(folder) ? folder : folder.entries);
    }
    self.measureFolder = function(folder){
        var folderSize = 0;

        function scan(array){
            for(var item of array){
                if(item.getType() === "folder"){
                    scan(item.entries);
                }else{
                    folderSize += item.getSize();
                }
            }
        }

        scan(Array.isArray(folder) ? folder : folder.entries);

        return folderSize;
    }
}