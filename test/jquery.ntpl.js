jQuery.$ = function(obj,arg,root,i,$) {
	
	root = ($=jQuery)(obj.apply(arg));
	
	for (i in obj)
		root.append($.$(obj[i],arg[i]));
		
	return root;
	
}