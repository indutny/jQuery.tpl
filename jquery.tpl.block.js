/**@preserve jQuery.tpl block plugin v.0.0.1;Copyright 2010, Fedor Indutny;Released under MIT license **/
(function ($,data,length, blockStack, undefined) {
	
	/** @const */
	var ext = "e";
	/** @const */
	var namespace ="n";
	/** @const */
	var args =  "a";
	/** @const */
	var cached_args = "q";
	/** @const */
	var cached_$_ = "_";
	/** @const */
	var flag = "f";
	
	
	function $extends($_,gid,name, argums, junk, $this) {
	
		
		data[gid][ext] = $.template(name);
		argums = argums || {};
		$this = this;
		
		$_.join = function () {
			$_ = [];
			argums[blockStack] = data[gid][args];			
			$this.$p(
				data
					[gid]
						[ext](
							argums
						)
			, $_);
			
			init(gid);
			
			return $_.join("");
		}		
		
	}
	
	function $block(name, gid, code, flag, $_, cache,$args) {
		cache=data[gid];
		if (!flag) {
			$args = cache[cached_args] = this;
			cache[cached_$_]= $_;
		} else {
			$args = cache[cached_args];
			$_ = cache[cached_$_];		
		}
		
		if (cache[ext]) {
			// If calling from extending template
			(cache = data[gid][args][name]) ?
				(cache[cache[length]] = code([]))
				:
				(data[gid][args][name] = [ code([]) ]);
			
			return;
		}
		
		// If calling from extended template			
		if ((flag = $args[blockStack]) && flag[name])
			(cache = (code = flag[name])[0]) && (code[length]>1) && (flag[name] = code.slice(1));
		else
			cache= code([]);
		$args.$p(cache , $_);	
	}
	
	function init(gid, namespace) {
		data [gid] = {};
		data [gid][args] = {};
		data [gid][namespace]=namespace || data[gid][namespace];
		data [gid][flag] = 0;
	}
	
	function align(namespace) {
		if (data[namespace.$gid]) return namespace.$gid;
		
		init(namespace.$gid, namespace);
		
		namespace.$extends = $extends;
		namespace.$block = $block;
		
		return namespace.$gid;
	}
	
	$.extend($.template.modificators,{
		"extends" : function (str , namespace) {
			return "$extends($_," + align(namespace) +	"," + str + ");";			
		},
		"block" : function (name , namespace) {
			
			return "$block(" + name + "," + align(namespace) + ",function($_){";
			
		},
		"/block" : function (junk, namespace, gid, store) {			
			gid = align(namespace);
			store = data[gid][flag];
			
			data[gid][flag] = 1;
			
			return ";return $_.join('')},"+store + (store ? ");" : ",$_);");
		}
	});
})(jQuery,{},"length","$blockStack");