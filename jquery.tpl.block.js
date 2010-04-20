/**@preserve jQuery.tpl block plugin v.0.0.1;Copyright 2010, Fedor Indutny;Released under MIT license **/
(function ($,undefined) {
	var data = {};
	
	function pushStack(gid, name) {
			console.log('push',gid,name);		
		data[gid].stack[data[gid].stack.length] = name;
		
		return gid;
	}
	
	function popStack(gid) {		console.log('pop',gid);
		data[gid].stack.length--;
	}
	
	function fromStack(gid, blocks , name) {
	
		var stack = blocks,
			  temp = blocks,
			  i,
			  len = stack.length;
		
		for ( i=0; i<len;i++)
			temp = temp[ stack[i] ] || {};
		
		return temp[name];
		
	}
	
	function toStack(gid, blocks, name, value) {
	
		var stack = blocks,
			  temp = blocks,
			  i,
			  len = stack.length;
		
		for ( i=0; i<len;i++)
			temp = temp[ stack[i] ] || {};
		
		temp[name] = value;
	}
	
	function $extends($_,name, args, gid, junk) {
	
		data[gid].ext = $.template(name);
		var $this = this;		
		$_.join = function () {
			
			var $_ = [];			console.log(data[gid].args);
			$this.$p(data[gid].ext($.extend(true, {$blockStack : data[gid].args}, args)), $_);
			return Array.prototype.join.apply($_, [""]);
		}		
		
	}
	
	function $block($args, $_, name, gid, code) {
		var args;				console.log('block', $args, name, gid, code);		
		if (!data[gid].ext) {
			// If calling from extended template
			
			if (!$args.$blockStack || ( ! (args = fromStack(gid , $args.$blockStack,name) ) ) ) 
				return $args.$p(code,$_);
			
			return $args.$p(args,$_);
		}
		
		// If calling from extending template
		toStack(gid, data[gid].args, name, code);
	}
	
	function align(namespace, junk) {
		if (data[namespace.$gid]) return namespace.$gid;
		
		data[namespace.$gid] = {
			/** @private */
			namespace : namespace,
			/** @private */
			stack: [],
			/** @private */
			args: {}
		};
		
		$.extend(namespace,{
			$extends : $extends,
			$block : $block,			$push_block: pushStack,			$pop_block: popStack
		});
		
		return namespace.$gid;
	}
	
	$.extend($.template.modificators,{
		"extends" : function (str , namespace) {
		
			return [
				"$extends($_,",
				str,
				",",
				"{}",
				",",
				align(namespace),
				");"
			].join("");
			
		},
		"block" : function (name , namespace) {
			
			return "$push_block("+align(namespace)+","+name+");$block($args,$_," + name + "," +  align(namespace) + ",(function($_){";
			
		},
		"/block" : function (junk, namespace) {			
		
			return ";return $_.join('')})([]));$pop_block("+align(namespace)+");";			
		}
	});
})(jQuery);